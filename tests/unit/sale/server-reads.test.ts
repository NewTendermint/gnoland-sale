import { describe, expect, it } from "vitest"
import { mapEntityBid, sumEntityUnits, unitsToUsd } from "../../../lib/sale/server-reads"

const tok = (hex: string) => `0x${hex}` as `0x${string}`

describe("sumEntityUnits", () => {
  it("sums committed and accepted base units across an entity's wallets and tokens", () => {
    const walletStates = [
      {
        committedAmountByToken: [
          { token: tok("aa"), amount: 100n },
          { token: tok("bb"), amount: 50n },
        ],
        acceptedAmountByToken: [{ token: tok("aa"), amount: 40n }],
      },
      {
        committedAmountByToken: [{ token: tok("aa"), amount: 25n }],
        acceptedAmountByToken: [],
      },
    ]
    expect(sumEntityUnits(walletStates)).toEqual({ committed: 175n, accepted: 40n })
  })

  it("is zero for an entity with no wallet states (attributed but never bid)", () => {
    expect(sumEntityUnits([])).toEqual({ committed: 0n, accepted: 0n })
  })
})

describe("unitsToUsd", () => {
  it("scales 6-decimal (USDC/USDT) base units to USD", () => {
    expect(unitsToUsd(1_000_000n, 6)).toBe(1)
    expect(unitsToUsd(281_144_000_000n, 6)).toBe(281_144)
    expect(unitsToUsd(0n, 6)).toBe(0)
  })
})

describe("mapEntityBid", () => {
  it("maps the contract's currentBid to UI USD (the live sale's 663 USDT bid at 3 increments)", () => {
    expect(mapEntityBid({ price: 3n, amount: 663_000_000n }, 6)).toEqual({
      priceUsd: 0.0645,
      committedUsd: 663,
    })
  })

  it("treats a zero amount as NO position, never a $0 bid", () => {
    // entityStatesByIDs answers a zeroed row for an entity that never bid; it does not revert.
    expect(mapEntityBid({ price: 0n, amount: 0n }, 6)).toBeNull()
    expect(mapEntityBid({ price: 3n, amount: 0n }, 6)).toBeNull()
  })

  it("treats a missing row as no position", () => {
    expect(mapEntityBid(undefined, 6)).toBeNull()
  })

  it("respects the payment token's decimals rather than assuming 6", () => {
    expect(mapEntityBid({ price: 3n, amount: 663_00000000n }, 8)?.committedUsd).toBe(663)
  })

  it("keeps the price exact where a float multiplication would drift", () => {
    expect(mapEntityBid({ price: 33n, amount: 1_000_000n }, 6)?.priceUsd).toBe(0.7095)
  })
})
