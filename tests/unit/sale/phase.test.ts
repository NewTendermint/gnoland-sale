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
  it("defaults to live when no override and no on-chain stage", () => {
    expect(resolveSalePhase({})).toBe("live")
  })
  it("derives from on-chain stage when present and no override", () => {
    expect(resolveSalePhase({ onChainStage: "PreOpen" })).toBe("pre-sale")
    expect(resolveSalePhase({ onChainStage: "Commitment" })).toBe("live")
    expect(resolveSalePhase({ onChainStage: "Cancellation" })).toBe("ended")
    expect(resolveSalePhase({ onChainStage: "Settlement" })).toBe("ended")
    expect(resolveSalePhase({ onChainStage: "Done" })).toBe("ended")
  })
  it("override beats on-chain stage", () => {
    expect(resolveSalePhase({ override: "pre-sale", onChainStage: "Commitment" })).toBe("pre-sale")
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
