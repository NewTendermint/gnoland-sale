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
// SaleSpecificEntityID is bytes16 on the contract (abi.ts) and in Sonar's payloads - keep the
// fixture the real width, the chain read encodes it as bytes16.
const MINE = hex("11".repeat(16))
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

const ENTITY: EntityDetails = {
  Label: "Test investor",
  EntityID: "e1",
  SaleSpecificEntityID: MINE,
  EntityType: EntityType.USER,
  EntitySetupState: EntitySetupState.COMPLETE,
  SaleEligibility: SaleEligibility.ELIGIBLE,
  InvestingRegion: InvestingRegion.OTHER,
}

/** Wire readMyBid with a stubbed Sonar client and a stubbed chain read. */
async function loadReadMyBid(opts: {
  entities?: EntityDetails[]
  chain?: () => Promise<unknown>
  commitmentData?: ReadCommitmentDataResponse
}) {
  vi.resetModules()
  const listAvailableEntities = vi.fn().mockResolvedValue({ Entities: opts.entities ?? [ENTITY] })
  const readCommitmentData = vi.fn().mockResolvedValue(opts.commitmentData ?? response)
  const createSonarClient = vi.fn((_accessToken?: string) => ({
    listAvailableEntities,
    readCommitmentData,
  }))
  const withSonarAuth = vi.fn((_sessionId: string, fn: (accessToken: string) => unknown) =>
    fn("mock-token"),
  )
  const readEntityBid = vi.fn(opts.chain ?? (async () => null))
  vi.doMock("../../lib/sonar/client", () => ({ createSonarClient }))
  vi.doMock("../../lib/sonar/permit", () => ({ withSonarAuth }))
  vi.doMock("../../lib/sale/server-reads", () => ({ readEntityBid }))
  const { readMyBid } = await import("../../lib/sonar/commitments")
  return { readMyBid, withSonarAuth, createSonarClient, readCommitmentData, readEntityBid }
}

describe("readMyBid", () => {
  it("resolves the entity with the session token, then reads the position from the chain", async () => {
    const chain = async () => ({ priceUsd: 0.0645, committedUsd: 663 })
    const t = await loadReadMyBid({ chain })

    expect(await t.readMyBid("session-1")).toEqual({ priceUsd: 0.0645, committedUsd: 663 })
    expect(t.withSonarAuth).toHaveBeenCalledTimes(1)
    expect(t.readEntityBid).toHaveBeenCalledWith(MINE)
    // The capped commitment list is NOT consulted while the chain answers.
    expect(t.readCommitmentData).not.toHaveBeenCalled()
  })

  it("returns null for an entity with no bid on-chain", async () => {
    const t = await loadReadMyBid({ chain: async () => null })
    expect(await t.readMyBid("session-1")).toBeNull()
  })

  it("returns null without touching the chain when the account holds no entity", async () => {
    const t = await loadReadMyBid({ entities: [] })
    expect(await t.readMyBid("session-1")).toBeNull()
    expect(t.readEntityBid).not.toHaveBeenCalled()
  })

  it("falls back to Sonar's window when the chain read fails", async () => {
    const t = await loadReadMyBid({
      chain: async () => {
        throw new Error("rpc down")
      },
      commitmentData: withCommitments([
        {
          CommitmentID: hex("aa".repeat(32)),
          SaleSpecificEntityID: MINE,
          PriceNumerator: "1",
          PriceDenominator: "1",
          PriceMicroUSD: "64500",
          Amounts: [
            { Wallet: hex("bb".repeat(20)), Token: hex("cc".repeat(20)), Amount: "663000000" },
          ],
          CreatedAt: "2026-07-20T12:42:11Z",
          ExtraRaw: hex(""),
          ExtraDataParsed: null,
        },
      ]),
    })

    expect(await t.readMyBid("session-1")).toEqual({ priceUsd: 0.0645, committedUsd: 663 })
  })

  it("THROWS rather than reporting no bid when the chain fails and Sonar's window misses", async () => {
    // The 100-row cap is exactly this case: absence from the window is not absence of a bid.
    const t = await loadReadMyBid({
      chain: async () => {
        throw new Error("rpc down")
      },
      commitmentData: withCommitments([]),
    })

    await expect(t.readMyBid("session-1")).rejects.toThrow("rpc down")
  })
})
