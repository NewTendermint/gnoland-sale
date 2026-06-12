import { describe, expect, it } from "vitest"
import { fmtCompactUsd, fmtCountdown } from "../../../lib/sale/format"

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
