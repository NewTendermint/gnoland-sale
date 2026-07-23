import { describe, expect, it } from "vitest"
import { sumEntityUnits, unitsToUsd } from "../../../lib/sale/server-reads"

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
