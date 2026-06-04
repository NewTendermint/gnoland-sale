import "server-only"
import { getStore } from "@netlify/blobs"
import { env } from "../env"
import { sonarCore } from "./server-only"

// PKCE state lives in a dedicated Blobs store, keyed by the random `state`
// value. Netlify Blobs has no native TTL (verified: docs.netlify.com Blobs,
// "does NOT support automatic expiration"), so expiry is stamped in metadata
// and enforced on read in consumePkceState.
const PKCE_STORE = "sonar-pkce"
const PKCE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export interface PkcePayload {
  sessionId: string
  codeVerifier: string
}

function pkceStore() {
  // On the Netlify runtime (Functions/Edge backing Next route handlers) siteID
  // and token are injected automatically; only the store name is needed.
  return getStore(PKCE_STORE)
}

/**
 * Generate PKCE params via the Sonar SDK, stash the verifier server-side keyed
 * by `state` (10-min TTL, write-once), and return the Sonar authorization URL.
 * The verifier never leaves the server; only `state` + `code_challenge` travel
 * to Sonar.
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
 * Consume a PKCE state on the OAuth callback: confirm it exists and is
 * unexpired, then return the stored verifier. The entry is deleted before any
 * value is returned (single-use), so a replayed callback cannot reuse it. This
 * is the CSRF/replay control for the OAuth flow; the caller additionally binds
 * `sessionId` to the current session.
 */
export async function consumePkceState(state: string): Promise<PkcePayload> {
  const store = pkceStore()
  const entry = await store.getWithMetadata(state, { type: "json" })
  if (!entry) {
    throw new Error("PKCE state not found")
  }
  // Delete first, unconditionally: even an expired or malformed entry must not
  // survive a consume attempt.
  await store.delete(state)
  const expiresAt = entry.metadata.expiresAt
  if (typeof expiresAt !== "number" || expiresAt < Date.now()) {
    throw new Error("PKCE state expired")
  }
  return entry.data as PkcePayload
}
