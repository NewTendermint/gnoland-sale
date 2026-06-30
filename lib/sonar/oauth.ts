import "server-only"
import { eq } from "drizzle-orm"
import { db } from "../db/client"
import { pkceStates } from "../db/schema"
import { env } from "../env"
import { sonarCore } from "./server-only"

// PKCE state in Postgres.
// 10-min TTL stamped on insert, enforced on read; single-use via atomic delete-returning.
const PKCE_TTL_MS = 10 * 60 * 1000

export interface PkcePayload {
  sessionId: string
  codeVerifier: string
}

/**
 * Stash the PKCE verifier server-side keyed by `state` (10-min TTL, write-once),
 * return the authorization URL. The verifier never leaves the server.
 */
export async function generatePkceAndStore(sessionId: string): Promise<string> {
  const { codeVerifier, codeChallenge, state } = await sonarCore.generatePKCEParams()
  await db.insert(pkceStates).values({
    state,
    sessionId,
    codeVerifier,
    expiresAt: new Date(Date.now() + PKCE_TTL_MS),
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
  // Delete first, atomically: even an expired/malformed entry must not survive a consume.
  const [row] = await db.delete(pkceStates).where(eq(pkceStates.state, state)).returning()
  if (!row) {
    throw new Error("PKCE state not found")
  }
  if (row.expiresAt.getTime() < Date.now()) {
    throw new Error("PKCE state expired")
  }
  return { sessionId: row.sessionId, codeVerifier: row.codeVerifier }
}
