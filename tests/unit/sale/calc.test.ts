import { describe, expect, it } from "vitest"
import {
  bidHeadroomPct,
  bidStatus,
  forceLockupForRegion,
  gnotEstimate,
  priceUsdToStepIndex,
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

// Floor-anchored increment grid: valid bids are $0.0645 + k*$0.01935,
// NO upper cap. The on-chain price is a step index from the floor.
describe("validateBidPrice - floor-anchored increment grid", () => {
  const band = { minPriceUsd: 0.0645, incrementUsd: 0.01935 }
  it("has no upper cap (a high on-grid price is accepted)", () => {
    expect(validateBidPrice((6450 + 6 * 1935) / 100_000, band)).toBe("ok")
    expect(validateBidPrice((6450 + 50 * 1935) / 100_000, band)).toBe("ok")
  })
  it("rejects off-increment prices", () => {
    expect(validateBidPrice(0.07, band)).toBe("off-increment")
    expect(validateBidPrice(0.1, band)).toBe("off-increment")
  })
  it("accepts the floor and every step above it (float-drift safe)", () => {
    for (let k = 0; k <= 8; k++) {
      expect(validateBidPrice((6450 + k * 1935) / 100_000, band)).toBe("ok")
    }
  })
  it("checks the floor before the monotonic-raise rule", () => {
    expect(validateBidPrice(0.05, { ...band, prevPriceUsd: 0.1 })).toBe("below-min")
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
  // The SettlementSale uint64 `price` is a STEP INDEX from the floor:
  // floor $0.0645 = step 0, then +1 per $0.01935 increment.
  it("priceUsdToStepIndex maps a USD price to a step index from the floor (floor = step 0)", () => {
    expect(priceUsdToStepIndex(0.0645, 0.0645, 0.01935)).toBe(0n)
    for (let k = 0; k <= 8; k++) {
      expect(priceUsdToStepIndex((6450 + k * 1935) / 100_000, 0.0645, 0.01935)).toBe(BigInt(k))
    }
  })
  it("priceUsdToStepIndex is float-drift safe on the 0.12255 trap (= step 3 exactly)", () => {
    expect(priceUsdToStepIndex(0.12255, 0.0645, 0.01935)).toBe(3n)
  })
  it("priceUsdToStepIndex rejects garbage (NaN/Infinity, zero increment, below the floor)", () => {
    expect(() => priceUsdToStepIndex(Number.POSITIVE_INFINITY, 0.0645, 0.01935)).toThrow()
    expect(() => priceUsdToStepIndex(-0.01, 0.0645, 0.01935)).toThrow()
    expect(() => priceUsdToStepIndex(0.0645, 0.0645, 0)).toThrow()
    expect(() => priceUsdToStepIndex(0.05, 0.0645, 0.01935)).toThrow()
  })
})

describe("snapBidPrice", () => {
  const band = { minPriceUsd: 0.0645, incrementUsd: 0.01935 }
  it("snaps an off-grid candidate UP to the next step", () => {
    expect(snapBidPrice(0.07, band)).toBeCloseTo(0.08385, 10) // floor + 1 step
  })
  it("clamps a below-floor candidate up to the floor", () => {
    expect(snapBidPrice(0.01, band)).toBeCloseTo(0.0645, 10)
  })
  it("has no upper cap - snaps a high candidate up to its grid step", () => {
    expect(snapBidPrice(0.13, band)).toBeCloseTo(0.1419, 10) // floor + 4 steps
  })
  it("leaves on-grid prices untouched", () => {
    expect(snapBidPrice(0.12255, band)).toBeCloseTo(0.12255, 10) // floor + 3 steps
  })
})
