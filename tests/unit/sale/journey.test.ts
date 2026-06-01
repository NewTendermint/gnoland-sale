import { describe, expect, it } from "vitest"
import { deriveJourney } from "../../../lib/sale/journey"
import { MOCK_JOURNEY_INPUTS } from "../../../lib/sale/mock"
import type { JourneyInput, JourneyState } from "../../../lib/sale/types"

const base: JourneyInput = {
  isConnected: false,
  isBaseChain: false,
  setupState: null,
  eligibility: null,
  myBid: null,
  clearingPriceUsd: 0.1,
}

// connected + on Base + KYC complete + eligible, ready to vary the tail of the funnel
const cleared: JourneyInput = {
  ...base,
  isConnected: true,
  isBaseChain: true,
  setupState: "complete",
  eligibility: "eligible",
}

describe("deriveJourney - wallet gates", () => {
  it("disconnected when no wallet", () => {
    expect(deriveJourney(base)).toBe("disconnected")
  })
  it("wrong-network when connected off Base", () => {
    expect(deriveJourney({ ...base, isConnected: true, isBaseChain: false })).toBe("wrong-network")
  })
})

describe("deriveJourney - KYC ladder (EntitySetupState)", () => {
  it("kyc-required when setupState is null", () => {
    expect(deriveJourney({ ...base, isConnected: true, isBaseChain: true, setupState: null })).toBe(
      "kyc-required",
    )
  })
  it("kyc-required when not-started", () => {
    expect(
      deriveJourney({ ...base, isConnected: true, isBaseChain: true, setupState: "not-started" }),
    ).toBe("kyc-required")
  })
  it("kyc-pending for every in-flight setup state", () => {
    for (const s of ["in-progress", "ready-for-review", "in-review"] as const) {
      expect(deriveJourney({ ...base, isConnected: true, isBaseChain: true, setupState: s })).toBe(
        "kyc-pending",
      )
    }
  })
  it("kyc-failed for every failure setup state", () => {
    for (const s of ["failure", "failure-final", "technical-issue"] as const) {
      expect(deriveJourney({ ...base, isConnected: true, isBaseChain: true, setupState: s })).toBe(
        "kyc-failed",
      )
    }
  })
})

describe("deriveJourney - eligibility + bid tail", () => {
  it("not-eligible when eligibility is not-eligible", () => {
    expect(deriveJourney({ ...cleared, eligibility: "not-eligible" })).toBe("not-eligible")
  })
  it("ready when complete + eligible + no bid", () => {
    expect(deriveJourney(cleared)).toBe("ready")
  })
  it("ready when setup complete but eligibility is unknown-setup-incomplete (only not-eligible blocks)", () => {
    expect(deriveJourney({ ...cleared, eligibility: "unknown-setup-incomplete" })).toBe("ready")
  })
  it("has-bid-winning when my price >= clearing", () => {
    expect(
      deriveJourney({
        ...cleared,
        myBid: { priceUsd: 0.2, committedUsd: 1000, lockup: false },
        clearingPriceUsd: 0.15,
      }),
    ).toBe("has-bid-winning")
  })
  it("has-bid-outbid when my price < clearing", () => {
    expect(
      deriveJourney({
        ...cleared,
        myBid: { priceUsd: 0.1, committedUsd: 1000, lockup: false },
        clearingPriceUsd: 0.15,
      }),
    ).toBe("has-bid-outbid")
  })
  it("has-bid-winning when nothing has cleared yet (clearing null)", () => {
    expect(
      deriveJourney({
        ...cleared,
        myBid: { priceUsd: 0.1, committedUsd: 1000, lockup: false },
        clearingPriceUsd: null,
      }),
    ).toBe("has-bid-winning")
  })
})

describe("deriveJourney round-trips MOCK_JOURNEY_INPUTS", () => {
  for (const state of Object.keys(MOCK_JOURNEY_INPUTS) as JourneyState[]) {
    it(`mock "${state}" derives back to "${state}"`, () => {
      expect(deriveJourney(MOCK_JOURNEY_INPUTS[state])).toBe(state)
    })
  }
})
