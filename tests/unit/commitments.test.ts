import {
  type EntityDetails,
  EntitySetupState,
  EntityType,
  InvestingRegion,
  type ReadCommitmentDataResponse,
  SaleEligibility,
} from "@echoxyz/sonar-core"
import { describe, expect, it, vi } from "vitest"
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
    expect(mapMyBid(res, MINE)).toEqual({ priceUsd: 0.15, committedUsd: 3200 })
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

  it("skips a malformed row (null id) instead of throwing for every bidder", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const malformed = {
      CommitmentID: hex("dd".repeat(16)),
      SaleSpecificEntityID: null,
      PriceNumerator: "1",
      PriceDenominator: "5",
      Amounts: [{ Wallet: hex("66".repeat(20)), Token: hex("44".repeat(20)), Amount: "1000000" }],
      CreatedAt: "2026-06-01T00:00:00Z",
      ExtraRaw: hex(""),
      ExtraDataParsed: null,
    } as unknown as ReadCommitmentDataResponse["Commitments"][number]
    const res = withCommitments([
      malformed,
      {
        CommitmentID: hex("c0".repeat(16)),
        SaleSpecificEntityID: MINE,
        PriceNumerator: "150000",
        PriceDenominator: "1000000",
        PriceMicroUSD: "150000",
        Amounts: [{ Wallet: hex("33".repeat(20)), Token: hex("44".repeat(20)), Amount: "2000000" }],
        CreatedAt: "2026-06-01T00:00:00Z",
        ExtraRaw: hex(""),
        ExtraDataParsed: null,
      },
    ])
    expect(mapMyBid(res, MINE)).toEqual({ priceUsd: 0.15, committedUsd: 2 })
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it("returns null without throwing when only malformed rows exist", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const malformed = {
      CommitmentID: hex("dd".repeat(16)),
      SaleSpecificEntityID: undefined,
      PriceNumerator: "1",
      PriceDenominator: "5",
      Amounts: [],
      CreatedAt: "2026-06-01T00:00:00Z",
      ExtraRaw: hex(""),
      ExtraDataParsed: null,
    } as unknown as ReadCommitmentDataResponse["Commitments"][number]
    expect(mapMyBid(withCommitments([malformed]), MINE)).toBeNull()
    warn.mockRestore()
  })

  it("fails loud when the session's own row has malformed Amounts - never a silent wrong position", () => {
    const res = withCommitments([
      {
        CommitmentID: hex("c0".repeat(16)),
        SaleSpecificEntityID: MINE,
        PriceNumerator: "150000",
        PriceDenominator: "1000000",
        PriceMicroUSD: "150000",
        Amounts: null as unknown as ReadCommitmentDataResponse["Commitments"][number]["Amounts"],
        CreatedAt: "2026-06-01T00:00:00Z",
        ExtraRaw: hex(""),
        ExtraDataParsed: null,
      },
    ])
    expect(() => mapMyBid(res, MINE)).toThrow(/malformed/)
  })

  it("fails loud on a non-finite price (zero denominator, no micro-USD)", () => {
    const res = withCommitments([
      {
        CommitmentID: hex("c0".repeat(16)),
        SaleSpecificEntityID: MINE,
        PriceNumerator: "1",
        PriceDenominator: "0",
        Amounts: [{ Wallet: hex("33".repeat(20)), Token: hex("44".repeat(20)), Amount: "1000000" }],
        CreatedAt: "2026-06-01T00:00:00Z",
        ExtraRaw: hex(""),
        ExtraDataParsed: null,
      },
    ])
    expect(() => mapMyBid(res, MINE)).toThrow(/malformed/)
  })

  it("matches the entity regardless of hex casing between the two Sonar endpoints", () => {
    const entityId = hex("ab".repeat(32))
    const res = withCommitments([
      {
        CommitmentID: hex("c0".repeat(16)),
        SaleSpecificEntityID: hex(entityId.slice(2).toUpperCase()),
        PriceNumerator: "1",
        PriceDenominator: "5",
        PriceMicroUSD: "200000",
        Amounts: [{ Wallet: hex("33".repeat(20)), Token: hex("44".repeat(20)), Amount: "1000000" }],
        CreatedAt: "2026-06-01T00:00:00Z",
        ExtraRaw: hex(""),
        ExtraDataParsed: null,
      },
    ])
    expect(mapMyBid(res, entityId)).toEqual({ priceUsd: 0.2, committedUsd: 1 })
  })
})

describe("readMyBid", () => {
  it("reads the public commitment data unauthenticated - only the entity lookup needs a token", async () => {
    vi.resetModules()
    const entity: EntityDetails = {
      Label: "Test investor",
      EntityID: "e1",
      SaleSpecificEntityID: MINE,
      EntityType: EntityType.USER,
      EntitySetupState: EntitySetupState.COMPLETE,
      SaleEligibility: SaleEligibility.ELIGIBLE,
      InvestingRegion: InvestingRegion.OTHER,
    }
    const listAvailableEntities = vi.fn().mockResolvedValue({ Entities: [entity] })
    const readCommitmentData = vi.fn().mockResolvedValue(response)
    const createSonarClient = vi.fn((_accessToken?: string) => ({
      listAvailableEntities,
      readCommitmentData,
    }))
    const withSonarAuth = vi.fn((_sessionId: string, fn: (accessToken: string) => unknown) =>
      fn("mock-token"),
    )
    vi.doMock("../../lib/sonar/client", () => ({ createSonarClient }))
    vi.doMock("../../lib/sonar/permit", () => ({ withSonarAuth }))
    const { readMyBid } = await import("../../lib/sonar/commitments")

    await readMyBid("session-1")

    expect(withSonarAuth).toHaveBeenCalledTimes(1)
    expect(createSonarClient).toHaveBeenLastCalledWith()
  })
})
