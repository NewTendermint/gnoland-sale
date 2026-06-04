import { afterEach, describe, expect, it, vi } from "vitest"
import { submitBidOnChain } from "../../lib/sale/onchain"

const ARGS = {
  params: { priceUsd: 0.12, amountUsd: 100, lockup: false },
  permit: { PermitJSON: {}, Signature: "0xabc123" },
  wallet: "0x0000000000000000000000000000000000000001" as const,
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("submitBidOnChain (on-chain seam)", () => {
  it("reverts in production: no contract is wired yet, so it never fakes a placed bid", async () => {
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
})
