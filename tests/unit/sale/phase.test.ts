import { describe, expect, it } from "vitest"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"
import { resolvePreSaleStage, resolveSalePhase } from "../../../lib/sale/phase"

describe("resolveSalePhase", () => {
  it("honors an explicit override", () => {
    expect(resolveSalePhase({ override: "pre-sale" })).toBe("pre-sale")
    expect(resolveSalePhase({ override: "ended" })).toBe("ended")
    expect(resolveSalePhase({ override: "live" })).toBe("live")
  })
  it("ignores an invalid override and falls back to default", () => {
    expect(resolveSalePhase({ override: "bogus" })).toBe("live")
    expect(resolveSalePhase({ override: null })).toBe("live")
  })
  it("defaults to live when no override and no clock given", () => {
    expect(resolveSalePhase({})).toBe("live")
  })
  it("derives the phase from the sale clock (the 3 economics dates)", () => {
    const opens = new Date(SALE_ECONOMICS.saleOpensIso).getTime()
    const closes = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
    expect(resolveSalePhase({ now: opens - 1000 })).toBe("pre-sale")
    expect(resolveSalePhase({ now: opens })).toBe("live")
    expect(resolveSalePhase({ now: closes - 1000 })).toBe("live")
    expect(resolveSalePhase({ now: closes })).toBe("ended")
    expect(resolveSalePhase({ now: closes + 1000 })).toBe("ended")
  })
  it("override beats the clock", () => {
    const closes = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
    expect(resolveSalePhase({ override: "pre-sale", now: closes + 1000 })).toBe("pre-sale")
  })
})

describe("resolvePreSaleStage", () => {
  it("is registration-open at or after registration opens", () => {
    expect(resolvePreSaleStage(new Date(SALE_ECONOMICS.registrationOpensIso).getTime())).toBe(
      "registration-open",
    )
    expect(
      resolvePreSaleStage(new Date(SALE_ECONOMICS.registrationOpensIso).getTime() + 86_400_000),
    ).toBe("registration-open")
  })
  it("is registration-closed before registration opens", () => {
    expect(resolvePreSaleStage(new Date("2026-06-01T00:00:00Z").getTime())).toBe(
      "registration-closed",
    )
  })
})
