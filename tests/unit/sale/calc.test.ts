import { describe, expect, it } from "vitest"
import {
  bidStatus,
  gnotEstimate,
  percentFilled,
  validateBidAmount,
  validateBidPrice,
} from "../../../lib/sale/calc"

describe("percentFilled", () => {
  // Marketing worked example: clearing $0.20, supply 31M -> 100% at $6.2M committed.
  it("is 1 when committed fills supply at the clearing price", () => {
    expect(percentFilled(6_200_000, 0.2, 31_000_000)).toBeCloseTo(1)
  })
  it("is 0.5 at half fill", () => {
    expect(percentFilled(3_100_000, 0.2, 31_000_000)).toBeCloseTo(0.5)
  })
  it("clamps the upper bound to 1 when oversubscribed", () => {
    expect(percentFilled(9_999_999, 0.2, 31_000_000)).toBe(1)
  })
  it("clamps the lower bound to 0 for zero or negative committed", () => {
    expect(percentFilled(0, 0.2, 31_000_000)).toBe(0)
    expect(percentFilled(-100, 0.2, 31_000_000)).toBe(0)
  })
  it("returns 0 when clearing price is 0 or null", () => {
    expect(percentFilled(100, 0, 31_000_000)).toBe(0)
    expect(percentFilled(100, null, 31_000_000)).toBe(0)
  })
  it("returns 0 when supply is 0 or negative (guard)", () => {
    expect(percentFilled(100, 0.2, 0)).toBe(0)
    expect(percentFilled(100, 0.2, -1)).toBe(0)
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
})
