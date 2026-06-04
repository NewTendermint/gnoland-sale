import { describe, expect, it } from "vitest"
import { fmtCompactUsd } from "../../../lib/sale/format"

// fmtCompactUsd is hand-rolled for deterministic output across JS engines; these
// assertions pin its exact format.
describe("fmtCompactUsd", () => {
  it("formats zero as $0", () => {
    expect(fmtCompactUsd(0)).toBe("$0")
  })

  it("formats thousands / millions / billions with one decimal", () => {
    expect(fmtCompactUsd(1500)).toBe("$1.5K")
    expect(fmtCompactUsd(1247)).toBe("$1.2K")
    expect(fmtCompactUsd(1_000_000)).toBe("$1M")
    expect(fmtCompactUsd(1_200_000)).toBe("$1.2M")
    expect(fmtCompactUsd(2_000_000)).toBe("$2M")
    expect(fmtCompactUsd(2_400_000_000)).toBe("$2.4B")
  })

  it("carries a rounding overflow up to the next unit (999_960 -> $1M)", () => {
    expect(fmtCompactUsd(999_960)).toBe("$1M")
  })

  it("rounds sub-$1 amounts down to $0", () => {
    expect(fmtCompactUsd(0.02)).toBe("$0")
  })
})
