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
 * sonar-core's `AuthSession` is a type-only export in 0.15.0 (it appears in the
 * .d.ts but not in the runtime export list, so the value is `undefined`), so we
 * cannot construct one to hand it a storage of our own. We do not need to: on
 * the server its default storage (createWebStorage) detects the absence of
 * `window` and falls back to an in-memory map, so `setToken` holds the access
 * token only for the lifetime of the request. It never reaches localStorage or
 * the browser.
 *
 * Doc gap: the sonar-core README recommends
 * `new AuthSession({ storage: createMemoryStorage() })` to force memory storage,
 * but because AuthSession has no runtime value at 0.15.0 that snippet throws
 * (`AuthSession is not a constructor`). The package is authoritative when the
 * docs lag, and this path reaches the same outcome.
 *
 * Do NOT memoize this into a shared/singleton client: the in-memory token lives
 * on the instance, so a shared client would bleed one request's token into the
 * next. A fresh client per call is required for isolation.
 *
 * Verified against @echoxyz/sonar-core@0.15.0 dist/index.cjs (createClient ->
 * AuthSession({ storage: createWebStorage() }); createWebStorage returns
 * createMemoryStorage() when window is undefined).
 */
export function createSonarClient(accessToken?: string): SonarClient {
  const client = sonarCore.createClient({
    apiURL: env.SONAR_API_BASE_URL,
    // TODO(real-data): mock fixtures are injected HERE. Going live is config-only
    // (drop SONAR_MOCK + set real Sonar creds) -> sonarMockEnabled() returns false
    // and the SDK uses the real network. No code change at this seam.
    // undefined -> SDK falls back to globalThis.fetch (real network).
    fetch: sonarMockEnabled() ? mockSonarFetch : undefined,
  })
  if (accessToken) {
    client.setToken(accessToken)
  }
  return client
}
