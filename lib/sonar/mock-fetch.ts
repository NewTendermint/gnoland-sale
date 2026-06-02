import "server-only"
import type { FetchLike } from "@echoxyz/sonar-core"
import { mockFixtures } from "./mock-fixtures"

// Maps a Sonar SDK request path to its fixture. Paths are the RPC endpoints the
// SDK posts to (verified in @echoxyz/sonar-core dist/index.cjs).
function fixtureForPath(path: string): unknown {
  if (path.endsWith("read-commitment-data")) return mockFixtures.commitmentData
  if (path.endsWith("PrePurchaseCheck")) return mockFixtures.prePurchase
  if (path.endsWith("GenerateSalePurchasePermit")) return mockFixtures.permit
  if (path.endsWith("ListAvailableEntities")) return mockFixtures.entities
  if (path.endsWith("ExchangeAuthorizationCodeV2") || path.endsWith("RefreshAccessToken")) {
    return mockFixtures.token
  }
  return {}
}

/**
 * A drop-in `fetch` for the Sonar SDK that returns local fixtures instead of
 * hitting the network. Injected into createClient({ fetch }) only when
 * SONAR_MOCK=1 in dev (see lib/sonar/client.ts). The entire real plumbing (SDK
 * parsing -> route handlers -> client hooks -> UI) runs unchanged; only the HTTP
 * response is a fixture. Swap to real Sonar = drop the flag + set real creds.
 */
export const mockSonarFetch: FetchLike = async (input) => {
  const url = input instanceof URL ? input : new URL(String(input))
  return new Response(JSON.stringify(fixtureForPath(url.pathname)), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
