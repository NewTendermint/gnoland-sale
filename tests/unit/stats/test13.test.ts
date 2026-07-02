import { describe, expect, it } from "vitest"
import { formatCompactCount } from "../../../lib/stats/test13"

describe("formatCompactCount", () => {
  it("floors thousands into a K+ suffix, keeping one decimal of nuance", () => {
    expect(formatCompactCount(688_024)).toBe("688K+") // .0 dropped
    expect(formatCompactCount(250_999)).toBe("250.9K+")
    expect(formatCompactCount(1_000)).toBe("1K+")
  })

  it("floors millions into an M+ suffix, one decimal (no more 1.9M -> 1M jump)", () => {
    expect(formatCompactCount(3_150_000)).toBe("3.1M+")
    expect(formatCompactCount(1_900_000)).toBe("1.9M+")
    expect(formatCompactCount(1_000_000)).toBe("1M+") // .0 dropped
  })

  it("never overstates: the floor keeps the '+' truthful", () => {
    expect(formatCompactCount(3_199_999)).toBe("3.1M+")
    expect(formatCompactCount(688_999)).toBe("688.9K+")
  })

  it("leaves sub-thousand counts as a plain N+", () => {
    expect(formatCompactCount(0)).toBe("0+")
    expect(formatCompactCount(999)).toBe("999+")
  })
})
