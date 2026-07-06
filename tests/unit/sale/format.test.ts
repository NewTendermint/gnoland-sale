import { describe, expect, it } from "vitest"
import { fmtCompactUsd, fmtCountdown, parseDecimal } from "../../../lib/sale/format"

describe("parseDecimal", () => {
  it("parses plain decimals unchanged", () => {
    expect(parseDecimal("0.0645")).toBe(0.0645)
    expect(parseDecimal("1000")).toBe(1000)
    expect(parseDecimal("")).toBe(0)
  })

  it("reads the EU comma as a decimal point", () => {
    expect(parseDecimal("0,0645")).toBe(0.0645)
    expect(parseDecimal("0,086")).toBe(0.086)
    expect(parseDecimal("1500,50")).toBe(1500.5)
    expect(parseDecimal("1,5")).toBe(1.5)
  })

  it("reads grouping commas as thousands separators", () => {
    expect(parseDecimal("1,000")).toBe(1000)
    expect(parseDecimal("150,000")).toBe(150000)
    expect(parseDecimal("1,000,000")).toBe(1000000)
    expect(parseDecimal("1,234.56")).toBe(1234.56)
  })

  it("keeps a trailing comma harmless while typing", () => {
    expect(parseDecimal("150,")).toBe(150)
  })
})

// fmtCompactUsd is hand-rolled for deterministic output across JS engines; these
// assertions pin its exact format.
describe("fmtCompactUsd", () => {
  it("formats zero as $0", () => {
    expect(fmtCompactUsd(0)).toBe("$0")
  })

  it("rounds thousands to a whole K (no decimal below $1M)", () => {
    expect(fmtCompactUsd(1500)).toBe("$2K")
    expect(fmtCompactUsd(1247)).toBe("$1K")
    expect(fmtCompactUsd(720_900)).toBe("$721K")
  })

  it("keeps one decimal from millions up", () => {
    expect(fmtCompactUsd(1_000_000)).toBe("$1M")
    expect(fmtCompactUsd(1_200_000)).toBe("$1.2M")
    expect(fmtCompactUsd(2_000_000)).toBe("$2M")
    expect(fmtCompactUsd(2_400_000_000)).toBe("$2.4B")
  })

  it("carries a rounding overflow up to the next unit (999_600 -> $1M)", () => {
    expect(fmtCompactUsd(999_600)).toBe("$1M")
    expect(fmtCompactUsd(999_499)).toBe("$999K")
  })

  it("rounds sub-$1 amounts down to $0", () => {
    expect(fmtCompactUsd(0.02)).toBe("$0")
  })
})

// fmtCountdown drives the always-ticking timers; these assertions pin the exact
// "Xd HH:MM:SS" shape (zero-padded clock, day prefix only from 24h up, zero clamp).
describe("fmtCountdown", () => {
  it("clamps past targets to 00:00:00", () => {
    expect(fmtCountdown(0)).toBe("00:00:00")
    expect(fmtCountdown(-5_000)).toBe("00:00:00")
  })

  it("floors sub-second remainders", () => {
    expect(fmtCountdown(999)).toBe("00:00:00")
  })

  it("renders a zero-padded clock under a day", () => {
    expect(fmtCountdown(5_000)).toBe("00:00:05")
    expect(fmtCountdown(61_000)).toBe("00:01:01")
    expect(fmtCountdown(3_600_000 + 2 * 60_000 + 3_000)).toBe("01:02:03")
    expect(fmtCountdown(86_400_000 - 1_000)).toBe("23:59:59")
  })

  it("prefixes whole days from 24h up", () => {
    expect(fmtCountdown(86_400_000)).toBe("1d 00:00:00")
    expect(fmtCountdown(32 * 86_400_000 + 14 * 3_600_000 + 3 * 60_000 + 27_000)).toBe(
      "32d 14:03:27",
    )
  })
})
