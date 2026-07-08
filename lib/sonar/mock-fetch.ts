import "server-only"
import type { FetchLike, ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { z } from "zod"
import { evmAddress } from "../validation"
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
    // Capped below the starting ceiling for the demo.
    ClearingPriceMicroUSD: String(Math.min(100_000 + Math.floor(t / 60) * 500, 116_100)),
  }
}

const permitRequestSchema = z.object({ PurchasingWalletAddress: evmAddress })

// A permit binds the wallet it was requested for (the on-chain preflight refuses a
// foreign-wallet permit, mirroring the contract's InvalidSender), so the mock must stamp
// the caller's wallet into the fixture exactly like real Sonar would.
function permitForRequest(body: unknown): unknown {
  const { permit } = mockFixtures
  if (typeof body !== "string") {
    return permit
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return permit
  }
  const request = permitRequestSchema.safeParse(parsed)
  if (!request.success) {
    return permit
  }
  return {
    ...permit,
    PermitJSON: { ...permit.PermitJSON, Wallet: request.data.PurchasingWalletAddress },
  }
}

// Maps a Sonar SDK request path to its fixture.
function fixtureForPath(path: string, body: unknown): unknown {
  if (path.endsWith("read-commitment-data")) return liveCommitmentData()
  if (path.endsWith("PrePurchaseCheck")) return mockFixtures.prePurchase
  if (path.endsWith("GenerateSalePurchasePermit")) return permitForRequest(body)
  if (path.endsWith("ListAvailableEntities")) return mockFixtures.entities
  if (path.endsWith("ExchangeAuthorizationCodeV2") || path.endsWith("RefreshAccessToken")) {
    return mockFixtures.token
  }
  return {}
}

/** Drop-in `fetch` for the Sonar SDK that returns local fixtures (SONAR_MOCK=1, dev). */
export const mockSonarFetch: FetchLike = async (input, init) => {
  const url = input instanceof URL ? input : new URL(String(input))
  return new Response(JSON.stringify(fixtureForPath(url.pathname, init?.body)), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}
