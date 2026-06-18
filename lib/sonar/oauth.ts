import "server-only"
import { getStore } from "@netlify/blobs"
import { env } from "../env"
import { sonarCore } from "./server-only"

// PKCE state in a Blobs store keyed by `state`. Netlify Blobs has no native TTL, so
// expiry is stamped in metadata and enforced on read in consumePkceState.
const PKCE_STORE = "sonar-pkce"
const PKCE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export interface PkcePayload {
  sessionId: string
  codeVerifier: string
}

function pkceStore() {
  return getStore(PKCE_STORE)
}

/**
 * Stash the PKCE verifier server-side keyed by `state` (10-min TTL, write-once),
 * return the authorization URL. The verifier never leaves the server.
 */
export async function generatePkceAndStore(sessionId: string): Promise<string> {
  const { codeVerifier, codeChallenge, state } = await sonarCore.generatePKCEParams()
  await pkceStore().setJSON(state, { sessionId, codeVerifier } satisfies PkcePayload, {
    metadata: { expiresAt: Date.now() + PKCE_TTL_MS },
    onlyIfNew: true,
  })
  const url = sonarCore.buildAuthorizationUrl({
    clientUUID: env.SONAR_CLIENT_UUID,
    redirectURI: env.SONAR_REDIRECT_URI,
    state,
    codeChallenge,
  })
  return url.toString()
}

/**
 * Consume a PKCE state on the OAuth callback (single-use, delete-before-return):
 * the CSRF/replay control for the OAuth flow. Caller also binds `sessionId`.
 */
export async function consumePkceState(state: string): Promise<PkcePayload> {
  const store = pkceStore()
  const entry = await store.getWithMetadata(state, { type: "json" })
  if (!entry) {
    throw new Error("PKCE state not found")
  }
  // Delete first, unconditionally: even an expired/malformed entry must not survive a consume.
  await store.delete(state)
  const expiresAt = entry.metadata.expiresAt
  if (typeof expiresAt !== "number" || expiresAt < Date.now()) {
    throw new Error("PKCE state expired")
  }
  return entry.data as PkcePayload
}
