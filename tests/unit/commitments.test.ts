import type { ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { describe, expect, it } from "vitest"
import { mapCommitmentData } from "../../lib/sonar/commitments"

// Mirrors the live mock (MOCK_COMMITMENT_LIVE): 1.2M USDC committed at 6
// decimals, clearing $0.12, 1247 bidders.
const response: ReadCommitmentDataResponse = {
  TotalCommitmentAmount: "1200000000000", // 1.2M * 10^6
  PaymentTokenDecimals: 6,
  ClearingPriceMicroUSD: "120000", // $0.12 in micro-USD
  UniqueCommitmentCount: 1247,
  Commitments: [],
}

describe("mapCommitmentData", () => {
  it("normalizes minor units and micro-USD to plain USD numbers", () => {
    expect(mapCommitmentData(response)).toEqual({
      totalCommittedUsd: 1_200_000,
      clearingPriceUsd: 0.12,
      uniqueCommitmentCount: 1247,
    })
  })

  it("returns a null clearing price before the auction has cleared", () => {
    const { ClearingPriceMicroUSD, ...beforeClear } = response
    expect(mapCommitmentData(beforeClear).clearingPriceUsd).toBeNull()
  })

  it("respects the payment token's decimals", () => {
    // $5.00 expressed in an 8-decimal token (kept within safe-integer range;
    // real payment tokens here are 6-decimal USDC/USDT).
    expect(
      mapCommitmentData({
        ...response,
        TotalCommitmentAmount: "500000000",
        PaymentTokenDecimals: 8,
      }).totalCommittedUsd,
    ).toBe(5)
  })
})
