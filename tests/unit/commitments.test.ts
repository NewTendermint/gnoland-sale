import type { ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { describe, expect, it } from "vitest"
import { mapCommitmentData, mapMyBid } from "../../lib/sonar/commitments"

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

const hex = (body: string) => `0x${body}` as `0x${string}`
const MINE = hex("11".repeat(32))
const withCommitments = (
  commitments: ReadCommitmentDataResponse["Commitments"],
): ReadCommitmentDataResponse => ({ ...response, Commitments: commitments })

describe("mapMyBid", () => {
  it("returns null when the entity has no commitment", () => {
    expect(mapMyBid(response, MINE)).toBeNull()
  })

  it("maps the entity's commitment to price + amount summed across its wallets", () => {
    const res = withCommitments([
      {
        CommitmentID: hex("c0".repeat(16)),
        SaleSpecificEntityID: MINE,
        PriceNumerator: "150000",
        PriceDenominator: "1000000",
        PriceMicroUSD: "150000",
        Amounts: [
          { Wallet: hex("33".repeat(20)), Token: hex("44".repeat(20)), Amount: "2000000000" },
          { Wallet: hex("55".repeat(20)), Token: hex("44".repeat(20)), Amount: "1200000000" },
        ],
        CreatedAt: "2026-06-01T00:00:00Z",
        ExtraRaw: hex(""),
        ExtraDataParsed: null,
      },
    ])
    expect(mapMyBid(res, MINE)).toEqual({ priceUsd: 0.15, committedUsd: 3200, lockup: false })
  })

  it("falls back to the numerator/denominator ratio when PriceMicroUSD is absent", () => {
    const res = withCommitments([
      {
        CommitmentID: hex("c0".repeat(16)),
        SaleSpecificEntityID: MINE,
        PriceNumerator: "1",
        PriceDenominator: "5",
        Amounts: [{ Wallet: hex("33".repeat(20)), Token: hex("44".repeat(20)), Amount: "1000000" }],
        CreatedAt: "2026-06-01T00:00:00Z",
        ExtraRaw: hex(""),
        ExtraDataParsed: null,
      },
    ])
    expect(mapMyBid(res, MINE)).toMatchObject({ priceUsd: 0.2, committedUsd: 1 })
  })
})
