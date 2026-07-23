import { describe, expect, it } from "vitest"
import { BONUS_CAP_USD, blendedBonus, currentTier } from "../../../lib/sale/bonus"

// The tiered contribution bonus is positional: the band a contribution earns depends on where it
// sits in the CUMULATIVE sale total. Bands: $0-1M -> 15%, 1-1.5M -> 10%, 1.5-2M -> 5%, 2-2.5M -> 3%.
// Fixtures mirror the four worked examples from the public announcement (Person A-D).

describe("currentTier", () => {
  it("returns the 15% band at the start of the sale", () => {
    expect(currentTier(0)).toMatchObject({ pct: 15, fromUsd: 0, untilUsd: 1_000_000 })
  })
  it("reports how much room is left in the current band", () => {
    expect(currentTier(900_000)?.remainingUsd).toBe(100_000)
  })
  it("crosses into the 10% band exactly at $1M", () => {
    expect(currentTier(1_000_000)?.pct).toBe(10)
  })
  it("is the 3% band inside the last stage", () => {
    expect(currentTier(2_100_000)?.pct).toBe(3)
  })
  it("returns null once the cap is reached (no band left)", () => {
    expect(currentTier(BONUS_CAP_USD)).toBeNull()
    expect(currentTier(BONUS_CAP_USD + 1)).toBeNull()
  })
})

describe("blendedBonus segments (announcement examples)", () => {
  // Person A: bids $600k when cumulative is $0 -> entirely in the 15% band.
  it("Person A: $600k at $0 cumulative -> all 15%", () => {
    const { segments } = blendedBonus(0, 600_000, 0.0645)
    expect(segments).toEqual([{ pct: 15, amountUsd: 600_000 }])
  })

  // Person D: bids $150k when cumulative is $900k -> $100k at 15%, $50k at 10%.
  it("Person D: $150k at $900k cumulative -> straddles 15% and 10%", () => {
    const { segments } = blendedBonus(900_000, 150_000, 0.0645)
    expect(segments).toEqual([
      { pct: 15, amountUsd: 100_000 },
      { pct: 10, amountUsd: 50_000 },
    ])
  })

  it("splits a contribution that spans the 5% / 3% boundary", () => {
    const { segments } = blendedBonus(1_950_000, 100_000, 0.0645)
    expect(segments).toEqual([
      { pct: 5, amountUsd: 50_000 },
      { pct: 3, amountUsd: 50_000 },
    ])
  })

  it("earns nothing on the portion above the cap", () => {
    const { segments } = blendedBonus(2_400_000, 200_000, 0.0645)
    // only $100k lands inside the last band; the $100k above $2.5M earns 0.
    expect(segments).toEqual([{ pct: 3, amountUsd: 100_000 }])
  })
})

describe("blendedBonus gnot + effective pct", () => {
  it("Person A: 15% of the base GNOT at the clearing price", () => {
    const clearing = 0.0645
    const base = 600_000 / clearing
    const { gnotBonus, effectivePct } = blendedBonus(0, 600_000, clearing)
    expect(gnotBonus).toBeCloseTo(base * 0.15, 6)
    expect(effectivePct).toBeCloseTo(15, 6)
  })

  it("Person D: weighted blend of 15% and 10% is between the two", () => {
    const { effectivePct } = blendedBonus(900_000, 150_000, 0.0645)
    // (100k*15 + 50k*10) / 150k = 13.33%
    expect(effectivePct).toBeCloseTo(40 / 3, 6)
  })

  it("returns a zero bonus when the clearing price is unknown", () => {
    const { gnotBonus, effectivePct } = blendedBonus(0, 600_000, null)
    expect(gnotBonus).toBe(0)
    expect(effectivePct).toBe(0)
  })

  it("returns no segments for a zero amount", () => {
    expect(blendedBonus(500_000, 0, 0.0645).segments).toEqual([])
  })
})
