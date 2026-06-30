import { afterEach, describe, expect, it, vi } from "vitest"
import { submitBidOnChain } from "../../lib/sale/onchain"

// No wallet is connected in the unit env, so getAccount() has no chainId and saleContractsFor()
// returns undefined -> the submit reverts with "Connect your wallet", never a fake/emulated bid.
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
  it("reverts with 'Connect your wallet' when no wallet is connected, in dev AND prod (never a fake bid)", async () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(await submitBidOnChain(ARGS)).toEqual({
      status: "reverted",
      reason: "Connect your wallet",
    })
    vi.stubEnv("NODE_ENV", "development")
    expect(await submitBidOnChain(ARGS)).toEqual({
      status: "reverted",
      reason: "Connect your wallet",
    })
  })

  it("never emulates a submitted bid - no fake success or txHash in any environment", async () => {
    vi.stubEnv("NODE_ENV", "development")
    const res = await submitBidOnChain(ARGS)
    expect(res.status).toBe("reverted")
    expect(res).not.toHaveProperty("txHash")
  })

  it("refuses when the purchase permit has no signature", async () => {
    const res = await submitBidOnChain({ ...ARGS, permit: { ...ARGS.permit, Signature: "" } })
    expect(res).toEqual({ status: "reverted", reason: "Missing purchase permit" })
  })
})
