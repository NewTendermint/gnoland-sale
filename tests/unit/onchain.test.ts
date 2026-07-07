import { afterEach, describe, expect, it, vi } from "vitest"
import {
  approvalPlan,
  assertUniformDecimals,
  bidPreflightReason,
  interpretBidReceipt,
  refundableUnits,
  selectPaymentToken,
  submitBidOnChain,
} from "../../lib/sale/onchain"

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
    expect(res).toEqual({ status: "reverted", reason: "Missing purchase permit." })
  })
})

describe("interpretBidReceipt (mined receipt + replacement -> bid result)", () => {
  const hash = "0xdead"
  it("treats a wallet cancellation as a reverted bid, not a placed one", () => {
    // A cancel is a 0-value self-send that mines "success" - must NOT read as submitted.
    expect(interpretBidReceipt({ status: "success", transactionHash: hash }, "cancelled")).toEqual({
      status: "reverted",
      reason: "You cancelled the transaction.",
    })
  })

  it("reverts on a reverted receipt", () => {
    expect(interpretBidReceipt({ status: "reverted", transactionHash: hash }, null)).toEqual({
      status: "reverted",
      reason: "The bid transaction failed on-chain.",
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
    expect(interpretBidReceipt({ status: "success", transactionHash: mined }, "repriced")).toEqual({
      status: "submitted",
      txHash: mined,
    })
  })

  it("rejects a 'replaced' tx: a different call won the nonce, the receipt is not our bid", () => {
    // viem only says "repriced" for identical to+value+input; "replaced" can be ANY other tx
    // (another dapp, another transfer) mining "success" - it must never read as a placed bid.
    expect(
      interpretBidReceipt({ status: "success", transactionHash: "0xnew" }, "replaced"),
    ).toEqual({
      status: "reverted",
      reason: "The transaction was replaced in your wallet.",
    })
  })
})

describe("refundableUnits (on-chain committed - accepted, the contract's _refund arithmetic)", () => {
  const USDC = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" as const
  const USDT = "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" as const
  const ws = (committed: [string, bigint][], accepted: [string, bigint][]) => ({
    committedAmountByToken: committed.map(([token, amount]) => ({
      token: token as `0x${string}`,
      amount,
    })),
    acceptedAmountByToken: accepted.map(([token, amount]) => ({
      token: token as `0x${string}`,
      amount,
    })),
  })

  it("includes a WINNER's pro-rata partial refund (the case the Sonar derivation shows as zero)", () => {
    // Committed 1000, accepted 800 after pro-rata scaling -> 200 refundable.
    expect(refundableUnits([ws([[USDC, 1_000_000_000n]], [[USDC, 800_000_000n]])])).toBe(
      200_000_000n,
    )
  })

  it("refunds the full commitment for an outbid entity (nothing accepted)", () => {
    expect(refundableUnits([ws([[USDC, 500_000_000n]], [])])).toBe(500_000_000n)
  })

  it("sums across wallets and tokens, matching accepted to committed by token address", () => {
    const walletA = ws([[USDC, 1_000n]], [[USDC, 400n]])
    const walletB = ws(
      [
        [USDT, 2_000n],
        [USDC, 100n],
      ],
      [[USDT, 1_500n]],
    )
    expect(refundableUnits([walletA, walletB])).toBe(600n + 500n + 100n)
  })

  it("matches token addresses case-insensitively and never goes negative", () => {
    expect(refundableUnits([ws([[USDC.toLowerCase(), 100n]], [[USDC, 100n]])])).toBe(0n)
    // Defensive: accepted > committed must clamp at 0, not underflow the total.
    expect(refundableUnits([ws([[USDC, 100n]], [[USDC, 150n]])])).toBe(0n)
  })

  it("is zero for a fully-filled winner and for no position", () => {
    expect(refundableUnits([ws([[USDC, 100n]], [[USDC, 100n]])])).toBe(0n)
    expect(refundableUnits([])).toBe(0n)
  })
})

describe("bidPreflightReason (pre-signature guards)", () => {
  const permit = (over: Partial<typeof ARGS.permit.PermitJSON>) => ({
    ...ARGS.permit.PermitJSON,
    ...over,
  })
  const NOW = 1_000_000
  // Neutral bid for the non-bound cases (fixture bounds are all 0 = deferred to the contract).
  const BID = { price: 5n, amount: 100_000_000n }

  it("rejects an expired permit before signing", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: NOW - 1 }), BID, 100n, 1000n, NOW)).toBe(
      "Your authorization expired, please try again.",
    )
  })

  it("ignores expiry when ExpiresAt is 0 (unset/mock)", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: 0 }), BID, 100n, 1000n, NOW)).toBeNull()
  })

  it("rejects when the USDC balance is below the amount delta", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: NOW + 600 }), BID, 100n, 99n, NOW)).toBe(
      "Insufficient USDC balance.",
    )
  })

  it("names the selected token in the balance message (USDT approval path)", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: NOW + 600 }), BID, 100n, 99n, NOW, "USDT")).toBe(
      "Insufficient USDT balance.",
    )
  })

  it("passes when balance covers the delta and the permit is live", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: NOW + 600 }), BID, 100n, 100n, NOW)).toBeNull()
  })

  it("skips the balance check for a price-only raise (delta 0)", () => {
    expect(bidPreflightReason(permit({ ExpiresAt: NOW + 600 }), BID, 0n, 0n, NOW)).toBeNull()
  })

  // Permit bounds: enforced pre-signature only when SET (> 0), with the same values and
  // comparators the contract applies - a zero bound stays the contract's call (issue #60).
  it("rejects a price outside a set MinPrice/MaxPrice with the on-chain wording", () => {
    const p = permit({ MinPrice: 3, MaxPrice: 40 })
    expect(bidPreflightReason(p, { ...BID, price: 2n }, 0n, 0n, NOW)).toBe(
      "Your price is outside the allowed range.",
    )
    expect(bidPreflightReason(p, { ...BID, price: 41n }, 0n, 0n, NOW)).toBe(
      "Your price is outside the allowed range.",
    )
    expect(bidPreflightReason(p, { ...BID, price: 40n }, 0n, 0n, NOW)).toBeNull()
  })

  it("rejects an amount outside a set MinAmount/MaxAmount with the on-chain wording", () => {
    const p = permit({ MinAmount: "100000000", MaxAmount: "500000000000000" })
    expect(bidPreflightReason(p, { ...BID, amount: 99_999_999n }, 0n, 0n, NOW)).toBe(
      "Your amount is outside the allowed range.",
    )
    expect(bidPreflightReason(p, { ...BID, amount: 500_000_000_000_001n }, 0n, 0n, NOW)).toBe(
      "Your amount is outside the allowed range.",
    )
    expect(bidPreflightReason(p, { ...BID, amount: 100_000_000n }, 0n, 0n, NOW)).toBeNull()
  })

  it("skips any bound left at 0 (unset caps defer to the contract)", () => {
    expect(
      bidPreflightReason(
        permit({ MaxPrice: 0, MaxAmount: "0" }),
        { price: 999_999n, amount: 10n ** 18n },
        0n,
        0n,
        NOW,
      ),
    ).toBeNull()
  })
})

// The contract assumes uniform decimals + 1:1 parity across payment tokens; every USD conversion
// in the app leans on that, so a drift must fail loudly before any money math.
describe("assertUniformDecimals (multi payment-token guard)", () => {
  it("accepts a single token and matching multi-token sets", () => {
    expect(() => assertUniformDecimals([{ symbol: "USDC", decimals: 6 }])).not.toThrow()
    expect(() =>
      assertUniformDecimals([
        { symbol: "USDC", decimals: 6 },
        { symbol: "USDT", decimals: 6 },
      ]),
    ).not.toThrow()
  })

  it("throws on a decimals drift, naming both tokens", () => {
    expect(() =>
      assertUniformDecimals([
        { symbol: "USDC", decimals: 6 },
        { symbol: "WEIRD", decimals: 18 },
      ]),
    ).toThrow(/USDC=6.*WEIRD=18/)
  })

  it("throws when the sale has no payment token at all", () => {
    expect(() => assertUniformDecimals([])).toThrow(/no payment token/)
  })
})

describe("selectPaymentToken (per-transaction funding token)", () => {
  const usdc = {
    address: "0xAAaA000000000000000000000000000000000001",
    symbol: "USDC",
    decimals: 6,
  } as const
  const usdt = {
    address: "0xBBbB000000000000000000000000000000000002",
    symbol: "USDT",
    decimals: 6,
  } as const

  it("defaults to USDC even when the contract registers it second (sandbox lists USDT first)", () => {
    expect(selectPaymentToken([usdt, usdc])).toBe(usdc)
    expect(selectPaymentToken([usdc, usdt])).toBe(usdc)
  })

  it("falls back to the first token when the sale has no USDC", () => {
    expect(selectPaymentToken([usdt])).toBe(usdt)
  })

  it("matches the requested address case-insensitively", () => {
    expect(selectPaymentToken([usdc, usdt], usdt.address.toUpperCase() as `0x${string}`)).toBe(usdt)
  })

  it("fails fast on a token the sale does not accept", () => {
    expect(() => selectPaymentToken([usdc], "0xCCcC000000000000000000000000000000000003")).toThrow(
      /not accepted/,
    )
  })
})

describe("approvalPlan (ERC-20 approve covering the delta)", () => {
  it("is a no-op when the allowance already covers the delta (or delta is 0)", () => {
    expect(approvalPlan(100n, 100n)).toBeNull()
    expect(approvalPlan(200n, 100n)).toBeNull()
    expect(approvalPlan(0n, 0n)).toBeNull()
  })

  it("approves the exact delta from a clean (zero) allowance", () => {
    expect(approvalPlan(0n, 150n)).toEqual({ resetFirst: false, amount: 150n })
  })

  it("zeroes a leftover allowance first (USDT reverts on non-zero -> non-zero approve)", () => {
    expect(approvalPlan(40n, 150n)).toEqual({ resetFirst: true, amount: 150n })
  })
})
