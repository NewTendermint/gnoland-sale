import "server-only"
import type { FetchLike, ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { mockFixtures } from "./mock-fixtures"

// TODO(real-data): DEMO-only, throwaway. Ramps the mock auction's totals over time
// so the live metrics visibly move on each poll. Fully self-contained - to go real,
// return mockFixtures.commitmentData directly and delete this. The per-entity
// Commitments stay fixed (your own bid does not move; the market around it does).
function liveCommitmentData(): ReadCommitmentDataResponse {
  const base = mockFixtures.commitmentData
  const unit = 10 ** base.PaymentTokenDecimals
  const t = Math.floor(Date.now() / 1000) % 3600 // ramps over an hour, then repeats
  return {
    ...base,
    TotalCommitmentAmount: String(Math.round((1_200_000 + t * 400) * unit)), // +~$4k / 10s
    UniqueCommitmentCount: 1247 + Math.floor(t / 20), // +1 bidder / 20s
    ClearingPriceMicroUSD: String(120_000 + Math.floor(t / 60) * 500), // +$0.0005 / min
  }
}

// Maps a Sonar SDK request path to its fixture. Paths are the RPC endpoints the
// SDK posts to (verified in @echoxyz/sonar-core dist/index.cjs).
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
