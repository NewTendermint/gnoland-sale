import { describe, expect, it } from "vitest"
import { mapLimits } from "../../lib/sonar/limits"

// Sonar fetchLimits returns commitment min/max as strings in the payment token's smallest units
// (A.17.7). The decimals are read dynamically (not hardcoded): USDC = 6 -> "2000000" = $2.
describe("mapLimits", () => {
  it("converts the USDC (6dp) minimum to USD - the sandbox $2", () => {
    expect(
      mapLimits(
        {
          HasCustomCommitmentAmountLimit: false,
          MinCommitmentAmount: "2000000",
          MaxCommitmentAmount: "0",
        },
        6,
      ).minUsd,
    ).toBe(2)
  })
  it("uses the passed decimals, not a hardcoded 6 (e.g. an 18dp token)", () => {
    expect(
      mapLimits(
        {
          HasCustomCommitmentAmountLimit: false,
          MinCommitmentAmount: "2000000000000000000",
          MaxCommitmentAmount: "0",
        },
        18,
      ).minUsd,
    ).toBe(2)
  })
  it("converts a $100 minimum", () => {
    expect(
      mapLimits(
        {
          HasCustomCommitmentAmountLimit: false,
          MinCommitmentAmount: "100000000",
          MaxCommitmentAmount: "0",
        },
        6,
      ).minUsd,
    ).toBe(100)
  })
  it("treats a 0 maximum as no cap (null), matching economics.maxCommitmentUsd", () => {
    expect(
      mapLimits(
        {
          HasCustomCommitmentAmountLimit: false,
          MinCommitmentAmount: "2000000",
          MaxCommitmentAmount: "0",
        },
        6,
      ).maxUsd,
    ).toBeNull()
  })
  it("converts a real maximum", () => {
    expect(
      mapLimits(
        {
          HasCustomCommitmentAmountLimit: true,
          MinCommitmentAmount: "2000000",
          MaxCommitmentAmount: "100000000000",
        },
        6,
      ).maxUsd,
    ).toBe(100000)
  })
  it("passes through the per-entity custom-limit flag", () => {
    const base = { MinCommitmentAmount: "2000000", MaxCommitmentAmount: "0" }
    expect(mapLimits({ ...base, HasCustomCommitmentAmountLimit: true }, 6).hasCustom).toBe(true)
    expect(mapLimits({ ...base, HasCustomCommitmentAmountLimit: false }, 6).hasCustom).toBe(false)
  })
})
