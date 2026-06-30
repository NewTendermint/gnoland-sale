import { describe, expect, it } from "vitest"
import {
  bidHeadroomPct,
  bidStatus,
  forceLockupForRegion,
  gnotEstimate,
  priceUsdToTickUnits,
  snapBidPrice,
  usdToTokenUnits,
  validateBidAmount,
  validateBidPrice,
} from "../../../lib/sale/calc"

describe("forceLockupForRegion", () => {
  it("forces the lockup flag for US entities (Sonar A.17.8: the contract rejects a US bid without it)", () => {
    expect(forceLockupForRegion("us")).toBe(true)
  })
  it("does not force it for non-US, unknown, or an absent region", () => {
    expect(forceLockupForRegion("eu")).toBe(false)
    expect(forceLockupForRegion("other")).toBe(false)
    expect(forceLockupForRegion("unknown")).toBe(false)
    expect(forceLockupForRegion(null)).toBe(false)
    expect(forceLockupForRegion(undefined)).toBe(false)
  })
})

describe("gnotEstimate", () => {
  it("is commitment / clearing price", () => {
    expect(gnotEstimate(2000, 0.0645)).toBeCloseTo(31_007.75, 1)
  })
  it("is 0 for a zero commitment", () => {
    expect(gnotEstimate(0, 0.0645)).toBe(0)
  })
  it("is 0 when clearing is 0, null, or negative", () => {
    expect(gnotEstimate(2000, 0)).toBe(0)
    expect(gnotEstimate(2000, null)).toBe(0)
    expect(gnotEstimate(2000, -1)).toBe(0)
  })
})

describe("bidHeadroomPct", () => {
  it("is the relative gap from the clearing price up to the bid price", () => {
    expect(bidHeadroomPct(0.129, 0.12)).toBeCloseTo(0.075, 6)
    expect(bidHeadroomPct(0.12255, 0.12)).toBeCloseTo(0.02125, 6)
  })
  it("is 0 when the bid sits exactly at the clearing price", () => {
    expect(bidHeadroomPct(0.12, 0.12)).toBe(0)
  })
  it("is null before anything clears (clearing null, 0, or negative)", () => {
    expect(bidHeadroomPct(0.12, null)).toBeNull()
    expect(bidHeadroomPct(0.12, 0)).toBeNull()
    expect(bidHeadroomPct(0.12, -1)).toBeNull()
  })
})

describe("bidStatus", () => {
  it("wins when my price >= clearing (including equal)", () => {
    expect(bidStatus(0.2, 0.2)).toBe("winning")
    expect(bidStatus(0.25, 0.2)).toBe("winning")
  })
  it("is outbid when my price < clearing", () => {
    expect(bidStatus(0.15, 0.2)).toBe("outbid")
  })
  it("is winning when nothing has cleared yet (clearing null) but a bid exists", () => {
    expect(bidStatus(0.1, null)).toBe("winning")
  })
  it("is none when there is no bid", () => {
    expect(bidStatus(null, 0.2)).toBe("none")
    expect(bidStatus(null, null)).toBe("none")
  })
})

describe("validateBidAmount", () => {
  it("flags below min", () => {
    expect(validateBidAmount(100, 200, 100_000)).toBe("too-low")
    expect(validateBidAmount(0, 200, 100_000)).toBe("too-low")
  })
  it("accepts the min and max boundaries", () => {
    expect(validateBidAmount(200, 200, 100_000)).toBe("ok")
    expect(validateBidAmount(100_000, 200, 100_000)).toBe("ok")
  })
  it("flags above max", () => {
    expect(validateBidAmount(100_001, 200, 100_000)).toBe("too-high")
  })
  it("skips the max check when max is null (no maximum commitment)", () => {
    expect(validateBidAmount(100_000_000, 200, null)).toBe("ok")
    expect(validateBidAmount(100, 200, null)).toBe("too-low")
  })
  it("rejects non-finite amounts (NaN, Infinity) instead of accepting them", () => {
    expect(validateBidAmount(Number.NaN, 200, 100_000)).not.toBe("ok")
    expect(validateBidAmount(Number.POSITIVE_INFINITY, 200, 100_000)).not.toBe("ok")
  })
})

describe("validateBidPrice", () => {
  it("requires >= min price", () => {
    expect(validateBidPrice(0.05, { minPriceUsd: 0.0645 })).toBe("below-min")
    expect(validateBidPrice(0.0645, { minPriceUsd: 0.0645 })).toBe("ok")
    expect(validateBidPrice(0.1, { minPriceUsd: 0.0645 })).toBe("ok")
  })
  it("enforces monotonic raise when a previous price exists", () => {
    expect(validateBidPrice(0.1, { minPriceUsd: 0.0645, prevPriceUsd: 0.12 })).toBe(
      "below-previous",
    )
    expect(validateBidPrice(0.13, { minPriceUsd: 0.0645, prevPriceUsd: 0.12 })).toBe("ok")
  })
  it("allows a price exactly equal to the previous price (raise is >=)", () => {
    expect(validateBidPrice(0.12, { minPriceUsd: 0.0645, prevPriceUsd: 0.12 })).toBe("ok")
  })
  it("reports below-min first when a price is below both min and previous", () => {
    expect(validateBidPrice(0.05, { minPriceUsd: 0.0645, prevPriceUsd: 0.12 })).toBe("below-min")
  })
  it("rejects non-finite prices (NaN, Infinity) instead of accepting them", () => {
    expect(validateBidPrice(Number.NaN, { minPriceUsd: 0.0645 })).not.toBe("ok")
    expect(validateBidPrice(Number.POSITIVE_INFINITY, { minPriceUsd: 0.0645 })).not.toBe("ok")
  })
})

// Hardcap + increment grid, confirmed 2026-06-13: bids run $0.0645 to $0.1290 in
// $0.00645 steps; anything off-grid or above the cap is an error.
describe("validateBidPrice - hardcap and increment grid", () => {
  const band = { minPriceUsd: 0.0645, maxPriceUsd: 0.129, incrementUsd: 0.00645 }
  it("rejects a price above the hardcap", () => {
    expect(validateBidPrice(0.13545, band)).toBe("above-max")
    expect(validateBidPrice(0.129, band)).toBe("ok")
  })
  it("rejects off-increment prices", () => {
    expect(validateBidPrice(0.07, band)).toBe("off-increment")
    expect(validateBidPrice(0.1, band)).toBe("off-increment")
  })
  it("accepts every grid step from min to max (float-drift safe)", () => {
    for (let k = 10; k <= 20; k++) {
      expect(validateBidPrice((k * 645) / 100_000, band)).toBe("ok")
    }
  })
  it("checks the band before the monotonic-raise rule", () => {
    expect(validateBidPrice(0.2, { ...band, prevPriceUsd: 0.129 })).toBe("above-max")
  })
})

// The float-to-integer traps these exist for: 0.12255 * 1e6 floats to
// 122550.00000000001, and naive truncation would ship a wrong on-chain price.
describe("on-chain unit conversions", () => {
  it("usdToTokenUnits scales exactly at 6 decimals (USDC/USDT on Base)", () => {
    expect(usdToTokenUnits(5000, 6)).toBe(5_000_000_000n)
    expect(usdToTokenUnits(200, 6)).toBe(200_000_000n)
    expect(usdToTokenUnits(100_000, 6)).toBe(100_000_000_000n)
  })
  it("usdToTokenUnits rounds sub-unit dust instead of truncating", () => {
    expect(usdToTokenUnits(0.1 + 0.2, 6)).toBe(300_000n)
  })
  it("usdToTokenUnits rejects garbage", () => {
    expect(() => usdToTokenUnits(Number.NaN, 6)).toThrow()
    expect(() => usdToTokenUnits(-1, 6)).toThrow()
    expect(() => usdToTokenUnits(1, 19)).toThrow()
  })
  // The SettlementSale `uint64 price` is in BID-INCREMENT tick units, not micro-USD
  // (SettlementSale.sol l.91/271 + docs.echo.xyz: "price 100 = $1.00 if increment $0.01").
  // So price = priceUsd / bidIncrementUsd. For our band: floor $0.0645 -> 10, ceiling $0.129 -> 20.
  it("priceUsdToTickUnits maps a USD price to bid-increment tick units (floor=10, ceiling=20)", () => {
    const increment = 0.00645
    expect(priceUsdToTickUnits(0.0645, increment)).toBe(10n)
    expect(priceUsdToTickUnits(0.129, increment)).toBe(20n)
    for (let k = 10; k <= 20; k++) {
      expect(priceUsdToTickUnits((k * 645) / 100_000, increment)).toBe(BigInt(k))
    }
  })
  it("priceUsdToTickUnits is float-drift safe on the 0.12255 trap (= 19 ticks exactly)", () => {
    expect(priceUsdToTickUnits(0.12255, 0.00645)).toBe(19n)
  })
  it("priceUsdToTickUnits rejects garbage (NaN/Infinity/negative price, zero increment)", () => {
    expect(() => priceUsdToTickUnits(Number.POSITIVE_INFINITY, 0.00645)).toThrow()
    expect(() => priceUsdToTickUnits(-0.01, 0.00645)).toThrow()
    expect(() => priceUsdToTickUnits(0.0645, 0)).toThrow()
  })
})

describe("snapBidPrice", () => {
  const band = { minPriceUsd: 0.0645, maxPriceUsd: 0.129, incrementUsd: 0.00645 }
  it("snaps an off-grid candidate UP to the next step", () => {
    expect(snapBidPrice(0.07, band)).toBeCloseTo(0.07095, 10)
  })
  it("clamps below-min and above-max candidates into the band", () => {
    expect(snapBidPrice(0.01, band)).toBeCloseTo(0.0645, 10)
    expect(snapBidPrice(0.1425, band)).toBeCloseTo(0.129, 10)
  })
  it("leaves on-grid prices untouched", () => {
    expect(snapBidPrice(0.0903, band)).toBeCloseTo(0.0903, 10)
  })
})
