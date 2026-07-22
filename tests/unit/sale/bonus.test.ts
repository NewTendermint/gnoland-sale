import { describe, expect, it } from "vitest"
import { firstDayBonusClosesIso, isWithinBonusWindow } from "../../../lib/sale/bonus"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"

const OPEN_MS = new Date(SALE_ECONOMICS.saleOpensIso).getTime()
const DAY_MS = 24 * 60 * 60 * 1000

describe("firstDayBonusClosesIso", () => {
  it("is exactly 24h after sale open", () => {
    expect(new Date(firstDayBonusClosesIso).getTime()).toBe(OPEN_MS + DAY_MS)
  })
})

describe("isWithinBonusWindow", () => {
  it("is false just before open", () => {
    expect(isWithinBonusWindow(OPEN_MS - 1)).toBe(false)
  })
  it("is true at open (inclusive)", () => {
    expect(isWithinBonusWindow(OPEN_MS)).toBe(true)
  })
  it("is true mid-window", () => {
    expect(isWithinBonusWindow(OPEN_MS + DAY_MS / 2)).toBe(true)
  })
  it("is false at the +24h boundary (exclusive)", () => {
    expect(isWithinBonusWindow(OPEN_MS + DAY_MS)).toBe(false)
  })
})
