import { describe, expect, it } from "vitest"
import { bidFailureCode } from "../../../lib/analytics/track"

// bidFailureCode turns a human failure line (or a stable Sonar/sentinel code) into a closed
// analytics slug, so every distinct failure cause is countable instead of collapsing into one
// bucket. The strings below are the verbatim outputs of the failure producers in lib/sale.

describe("bidFailureCode - stable codes and sentinels pass through", () => {
  it.each([
    ["wrong-chain", "wrong-chain"],
    ["Connect your wallet", "not-connected"],
    ["session-expired", "session-expired"],
    ["entity-not-eligible", "entity-not-eligible"],
    ["wallet-risk", "wallet-risk"],
    ["max-wallets-used", "max-wallets-used"],
    ["requires-liveness", "requires-liveness"],
    ["sale-not-active", "sale-not-active"],
    ["wallet-not-linked", "wallet-not-linked"],
    ["outside-time-window", "outside-time-window"],
  ])("%s -> %s", (reason, code) => {
    expect(bidFailureCode(reason)).toBe(code)
  })
})

describe("bidFailureCode - on-chain human lines", () => {
  it.each([
    ["You cancelled the signature.", "user-rejected"],
    ["You cancelled the transaction.", "user-rejected"],
    ["The transaction was replaced in your wallet.", "tx-replaced"],
    ["Not enough ETH to cover network fees.", "insufficient-eth-gas"],
    ["Your price is outside the allowed range.", "price-range"],
    ["Your amount is outside the allowed range.", "amount-range"],
    ["This bid must include the lockup.", "lockup-required"],
    ["A bid can only be raised, not lowered.", "cannot-lower"],
    ["Your authorization expired, please try again.", "permit-expired"],
    ["The sale isn't accepting bids right now.", "sale-window"],
    ["The sale isn't open right now.", "sale-window"],
    ["This wallet is already linked to another account.", "wallet-tied"],
    ["This wallet isn't linked to your verified identity.", "wallet-not-linked"],
    ["Missing purchase permit.", "missing-permit"],
    ["The approval transaction failed on-chain.", "approval-reverted"],
    ["The bid transaction failed on-chain.", "tx-reverted"],
    ["A bid is already in progress", "already-in-progress"],
  ])("%s -> %s", (reason, code) => {
    expect(bidFailureCode(reason)).toBe(code)
  })

  it("classifies the token-templated balance line for any token symbol", () => {
    expect(bidFailureCode("Insufficient USDC balance.")).toBe("insufficient-token")
    expect(bidFailureCode("Insufficient USDT balance.")).toBe("insufficient-token")
  })

  it("keeps the two sale-window layers under one code (contract vs Sonar wording)", () => {
    expect(bidFailureCode("The sale isn't accepting bids right now.")).toBe("sale-window")
    expect(bidFailureCode("The sale isn't open right now.")).toBe("sale-window")
  })
})

describe("bidFailureCode - fallback", () => {
  it.each([
    ["Could not place bid.", "generic"],
    ["unknown", "generic"],
    ["anything unmatched", "generic"],
    ["", "generic"],
    // Inherited object members must not leak through the exact-code lookup.
    ["toString", "generic"],
    ["constructor", "generic"],
  ])("%s -> generic", (reason, code) => {
    expect(bidFailureCode(reason)).toBe(code)
  })
})
