import "server-only"
import type { FetchLike, ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { mockFixtures } from "./mock-fixtures"

// TODO(real-data): demo-only, throwaway. Ramps the mock auction's totals over time. To go
// real, return mockFixtures.commitmentData directly and delete this.
function liveCommitmentData(): ReadCommitmentDataResponse {
  const base = mockFixtures.commitmentData
  const unit = 10 ** base.PaymentTokenDecimals
  const t = Math.floor(Date.now() / 1000) % 3600
  return {
    ...base,
    TotalCommitmentAmount: String(Math.round((1_200_000 + t * 400) * unit)),
    UniqueCommitmentCount: 1247 + Math.floor(t / 20),
    // Capped at $0.1161, below the $0.1290 hardcap.
    ClearingPriceMicroUSD: String(Math.min(100_000 + Math.floor(t / 60) * 500, 116_100)),
  }
}

// Maps a Sonar SDK request path to its fixture.
function fixtureForPath(path: string): unknown {
  if (path.endsWith("read-commitment-data")) return liveCommitmentData()
  if (path.endsWith("PrePurchaseCheck")) return mockFixtures.prePurchase
  if (path.endsWith("GenerateSalePurchasePermit")) return mockFixtures.permit
  if (path.endsWith("ListAvailableEntities")) return mockFixtures.entities
  if (path.endsWith("ExchangeAuthorizationCodeV2") || path.endsWith("RefreshAccessToken")) {
    return mockFixtures.token
  }
  return {}
}

/** Drop-in `fetch` for the Sonar SDK that returns local fixtures (SONAR_MOCK=1, dev). */
export const mockSonarFetch: FetchLike = async (input) => {
  const url = input instanceof URL ? input : new URL(String(input))
  return new Response(JSON.stringify(fixtureForPath(url.pathname)), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
