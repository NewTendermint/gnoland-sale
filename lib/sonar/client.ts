import "server-only"
import type { SonarClient } from "@echoxyz/sonar-core"
import { env } from "../env"
import { sonarMockEnabled } from "./mock-config"
import { mockSonarFetch } from "./mock-fetch"
import { sonarCore } from "./server-only"

/**
 * Build a per-request Sonar client, optionally bound to a user's access token.
 * Omit the token for the unauthenticated authorization-code exchange; pass it
 * for any authenticated call (pre-purchase, permit, commitments).
 *
 * On the server, createClient's default storage falls back to an in-memory map
 * (no `window`), so `setToken` holds the access token only for the lifetime of
 * the request and it never reaches localStorage or the browser. Never memoize
 * into a shared/singleton client: the in-memory token lives on the instance, so
 * a shared client would bleed one request's token into the next. A fresh client
 * per call is required for isolation.
 *
 * Verified against @echoxyz/sonar-core@0.15.0 dist/index.cjs: createClient ->
 * AuthSession({ storage: createWebStorage() }), and createWebStorage returns an
 * in-memory store when window is undefined. (AuthSession has no runtime value at
 * 0.15.0, so the README's `new AuthSession(...)` snippet would throw; this path
 * reaches the same outcome.)
 */
export function createSonarClient(accessToken?: string): SonarClient {
  const client = sonarCore.createClient({
    apiURL: env.SONAR_API_BASE_URL,
    // TODO(real-data): the mock fixtures are injected HERE. Going live is config
    // only (drop SONAR_MOCK + set real Sonar creds): sonarMockEnabled() then
    // returns false and `undefined` lets the SDK use globalThis.fetch (real
    // network). No code change at this seam.
    fetch: sonarMockEnabled() ? mockSonarFetch : undefined,
  })
  if (accessToken) {
    client.setToken(accessToken)
  }
  return client
}
