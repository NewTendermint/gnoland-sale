import { describe, expect, it } from "vitest"
import {
  type SettlementOutcome,
  deriveClaimView,
  deriveSettlement,
} from "../../../lib/sale/settlement"

describe("deriveSettlement", () => {
  it("returns null without a bid", () => {
    expect(deriveSettlement(null, 0.1161)).toBeNull()
  })

  it("returns null while the clearing price is unknown (not settled)", () => {
    const bid = { priceUsd: 0.12, committedUsd: 3200, lockup: false }
    expect(deriveSettlement(bid, null)).toBeNull()
    expect(deriveSettlement(bid, 0)).toBeNull()
  })

  it("a bid above clearing wins: fully filled, nothing refundable, allocation = filled / clearing", () => {
    const s = deriveSettlement({ priceUsd: 0.12255, committedUsd: 3200, lockup: false }, 0.1161)
    expect(s).not.toBeNull()
    expect(s?.status).toBe("won")
    expect(s?.committedUsd).toBe(3200)
    expect(s?.filledUsd).toBe(3200)
    expect(s?.refundableUsd).toBe(0)
    expect(s?.gnotAllocation).toBeCloseTo(3200 / 0.1161, 6)
  })

  it("a bid exactly at clearing wins", () => {
    const s = deriveSettlement({ priceUsd: 0.1161, committedUsd: 1000, lockup: false }, 0.1161)
    expect(s?.status).toBe("won")
    expect(s?.filledUsd).toBe(1000)
    expect(s?.refundableUsd).toBe(0)
  })

  it("a bid below clearing is outbid: zero allocation, full refund", () => {
    const s = deriveSettlement({ priceUsd: 0.1, committedUsd: 3200, lockup: false }, 0.1161)
    expect(s?.status).toBe("outbid")
    expect(s?.filledUsd).toBe(0)
    expect(s?.gnotAllocation).toBe(0)
    expect(s?.refundableUsd).toBe(3200)
  })
})

describe("deriveClaimView (Sonar estimate x on-chain gate, fail-closed)", () => {
  const outbid: SettlementOutcome = {
    status: "outbid",
    committedUsd: 3200,
    filledUsd: 0,
    refundableUsd: 3200,
    gnotAllocation: 0,
  }
  const winner: SettlementOutcome = {
    status: "won",
    committedUsd: 3200,
    filledUsd: 3200,
    refundableUsd: 0,
    gnotAllocation: 27562,
  }
  const gate = (over: Partial<Parameters<typeof deriveClaimView>[1] & object>) => ({
    done: true,
    claimEnabled: true,
    refunded: false,
    refundableUsd: 3200 as number | null,
    ...over,
  })

  it("gate unresolved: derived numbers display, but NO claim button and NO automatic-refunds line", () => {
    const v = deriveClaimView(outbid, undefined, false)
    expect(v.refundableUsd).toBe(3200)
    expect(v.showClaimButton).toBe(false)
    expect(v.showAutoRefundLine).toBe(false)
  })

  it("stage not Done: asserts nothing even with a positive derived refund", () => {
    const v = deriveClaimView(
      outbid,
      gate({ done: false, claimEnabled: false, refundableUsd: null }),
      false,
    )
    expect(v.showClaimButton).toBe(false)
    // Before Done, claiming that refunds are automatic would be false for a self-serve sale.
    expect(v.showAutoRefundLine).toBe(false)
  })

  it("opens the claim only on the contract's OWN refundable amount", () => {
    const v = deriveClaimView(outbid, gate({}), false)
    expect(v.showClaimButton).toBe(true)
    expect(v.refundableUsd).toBe(3200)
  })

  it("never opens the claim from the derived estimate: null on-chain refundable = wrong wallet / no position", () => {
    // The regression this guards: entity bid with wallet A, user connects wallet B - Sonar still
    // reports the entity's refundable, but the contract would revert this wallet's claim.
    const v = deriveClaimView(outbid, gate({ refundableUsd: null }), false)
    expect(v.showClaimButton).toBe(false)
    expect(v.refundableUsd).toBe(3200) // display keeps the estimate
  })

  it("surfaces a WINNER's pro-rata partial refund the derivation reports as zero", () => {
    const v = deriveClaimView(winner, gate({ refundableUsd: 480 }), false)
    expect(v.refundableUsd).toBe(480)
    expect(v.showClaimButton).toBe(true)
    // Allocation stays coherent with the refund: scaled by the same fill ratio
    // (accepted = committed - refund => 2720/3200 = 85%).
    expect(v.gnotAllocation).toBeCloseTo(27562 * 0.85, 6)
  })

  it("keeps the derived allocation upper bound while the contract's refund is unreadable", () => {
    const v = deriveClaimView(winner, undefined, false)
    expect(v.gnotAllocation).toBe(27562)
  })

  it("shows the automatic-refunds line only at Done with self-serve disabled", () => {
    const v = deriveClaimView(outbid, gate({ claimEnabled: false }), false)
    expect(v.showClaimButton).toBe(false)
    expect(v.showAutoRefundLine).toBe(true)
  })

  it("never promises automatic refunds from the derived estimate either (same guard as the button)", () => {
    const v = deriveClaimView(outbid, gate({ claimEnabled: false, refundableUsd: null }), false)
    expect(v.showAutoRefundLine).toBe(false)
  })

  it("an on-chain refunded entity shows Refund sent (no button, no line), keeping the historical amount", () => {
    const v = deriveClaimView(outbid, gate({ refunded: true }), false)
    expect(v.refunded).toBe(true)
    expect(v.showClaimButton).toBe(false)
    expect(v.showAutoRefundLine).toBe(false)
    expect(v.refundableUsd).toBe(3200)
  })

  it("a locally-completed claim reads as refunded before the next gate poll", () => {
    const v = deriveClaimView(outbid, gate({}), true)
    expect(v.refunded).toBe(true)
    expect(v.showClaimButton).toBe(false)
  })
})
