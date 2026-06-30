import { afterEach, describe, expect, it, vi } from "vitest"
import { submitBidOnChain } from "../../lib/sale/onchain"

// No wallet is connected in the unit env, so getAccount() has no chainId and saleContractsFor()
// returns undefined -> the emulation gate decides the outcome (the real tx path needs a live chain).
const ARGS = {
  params: { priceUsd: 0.12, amountUsd: 100, lockup: false },
  permit: {
    PermitJSON: {
      SaleSpecificEntityID: "0x1111111111111111111111111111aaaa",
      SaleUUID: "0xc4b494ad2f2746fabbd2c6b0bdd74887",
      Wallet: "0x0000000000000000000000000000000000000001",
      ExpiresAt: 0,
      MinAmount: "0",
      MaxAmount: "0",
      MinPrice: 0,
      MaxPrice: 0,
      OpensAt: 0,
      ClosesAt: 0,
      Payload: "0x",
    },
    Signature: "0xabc123",
  },
  wallet: "0x0000000000000000000000000000000000000001" as const,
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("submitBidOnChain (on-chain seam)", () => {
  it("reverts in production when no contract is configured for the chain (never fakes a placed bid)", async () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(await submitBidOnChain(ARGS)).toEqual({
      status: "reverted",
      reason: "On-chain bidding is not available yet",
    })
  })

  it("emulates a submitted bid in local dev so the funnel can be exercised end to end", async () => {
    vi.stubEnv("NODE_ENV", "development")
    const res = await submitBidOnChain(ARGS)
    expect(res.status).toBe("submitted")
  })

  it("refuses when the purchase permit has no signature", async () => {
    const res = await submitBidOnChain({ ...ARGS, permit: { ...ARGS.permit, Signature: "" } })
    expect(res).toEqual({ status: "reverted", reason: "Missing purchase permit" })
  })
})
