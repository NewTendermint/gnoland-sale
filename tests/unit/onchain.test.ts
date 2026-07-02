import { afterEach, describe, expect, it, vi } from "vitest"
import { bidPreflightReason, interpretBidReceipt, submitBidOnChain } from "../../lib/sale/onchain"

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

describe("interpretBidReceipt (mined receipt + replacement -> bid result)", () => {
  const hash = "0xdead"
  it("treats a wallet cancellation as a reverted bid, not a placed one", () => {
    // A cancel is a 0-value self-send that mines "success" - must NOT read as submitted.
    expect(interpretBidReceipt({ status: "success", transactionHash: hash }, "cancelled")).toEqual({
      status: "reverted",
      reason: "You cancelled the transaction",
    })
  })

  it("reverts on a reverted receipt", () => {
    expect(interpretBidReceipt({ status: "reverted", transactionHash: hash }, null)).toEqual({
      status: "reverted",
      reason: "The bid transaction failed on-chain",
    })
  })

  it("submits with the mined hash on a plain success", () => {
    expect(interpretBidReceipt({ status: "success", transactionHash: hash }, null)).toEqual({
      status: "submitted",
      txHash: hash,
    })
  })

  it("keeps a speed-up/reprice as a submitted bid at the mined (replacement) hash", () => {
    const mined = "0xnew"
    for (const reason of ["replaced", "repriced"] as const) {
      expect(interpretBidReceipt({ status: "success", transactionHash: mined }, reason)).toEqual({
        status: "submitted",
        txHash: mined,
      })
    }
  })
})

describe("bidPreflightReason (pre-signature guards)", () => {
  const permit = (over: Partial<typeof ARGS.permit.PermitJSON>) => ({
    ...ARGS.permit.PermitJSON,
    ...over,
  })
  const NOW = 1_000_000

  it("rejects an expired permit before signing", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: NOW - 1 }), 100n, 1000n, NOW)).toBe(
      "Your authorization expired - please try again",
    )
  })

  it("ignores expiry when ExpiresAt is 0 (unset/mock)", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: 0 }), 100n, 1000n, NOW)).toBeNull()
  })

  it("rejects when the USDC balance is below the amount delta", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: NOW + 600 }), 100n, 99n, NOW)).toBe(
      "Insufficient USDC balance",
    )
  })

  it("passes when balance covers the delta and the permit is live", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: NOW + 600 }), 100n, 100n, NOW)).toBeNull()
  })

  it("skips the balance check for a price-only raise (delta 0)", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: NOW + 600 }), 0n, 0n, NOW)).toBeNull()
  })
})
