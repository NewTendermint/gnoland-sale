import "server-only"
import type { SonarClient } from "@echoxyz/sonar-core"
import { env } from "../env"
import { sonarMockEnabled } from "./mock-config"
import { mockSonarFetch } from "./mock-fetch"
import { sonarCore } from "./server-only"

/**
 * Build a per-request Sonar client, optionally bound to a user's access token.
 * Never memoize into a shared/singleton client: the in-memory token lives on the
 * instance, so a shared client would bleed one request's token into the next.
 */
export function createSonarClient(accessToken?: string): SonarClient {
  const client = sonarCore.createClient({
    apiURL: env.SONAR_API_BASE_URL,
    // TODO(real-data): the mock fixtures are injected HERE. Going live is config only (drop SONAR_MOCK + set real Sonar creds).
    fetch: sonarMockEnabled() ? mockSonarFetch : undefined,
  })
  if (accessToken) {
    client.setToken(accessToken)
  }
  return client
}
