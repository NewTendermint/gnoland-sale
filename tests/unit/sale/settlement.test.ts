import { describe, expect, it } from "vitest"
import { deriveSettlement } from "../../../lib/sale/settlement"

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
