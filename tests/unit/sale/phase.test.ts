import { describe, expect, it } from "vitest"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"
import { resolvePreSaleStage, resolveSalePhase } from "../../../lib/sale/phase"

describe("resolveSalePhase", () => {
  it("derives the phase from the sale clock (the 3 economics dates)", () => {
    const opens = new Date(SALE_ECONOMICS.saleOpensIso).getTime()
    const closes = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
    expect(resolveSalePhase(opens - 1000)).toBe("pre-sale")
    expect(resolveSalePhase(opens)).toBe("live")
    expect(resolveSalePhase(closes - 1000)).toBe("live")
    expect(resolveSalePhase(closes)).toBe("ended")
    expect(resolveSalePhase(closes + 1000)).toBe("ended")
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
