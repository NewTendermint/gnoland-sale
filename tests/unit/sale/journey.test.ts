import { describe, expect, it } from "vitest"
import {
  deriveJourney,
  derivePositionState,
  derivePreSaleBar,
  isSonarVerified,
} from "../../../lib/sale/journey"
import { MOCK_JOURNEY_INPUTS } from "../../../lib/sale/mock"
import type { JourneyInput, JourneyState } from "../../../lib/sale/types"

const UNVERIFIED: JourneyState[] = [
  "kyc-required",
  "kyc-incomplete",
  "kyc-pending",
  "kyc-failed",
  "not-eligible",
]
const VERIFIED: JourneyState[] = [
  "disconnected",
  "wrong-network",
  "ready",
  "has-bid-winning",
  "has-bid-outbid",
  "has-bid-pending",
]

const base: JourneyInput = {
  isConnected: false,
  isSaleChain: false,
  hasSonarSession: false,
  hadEntityBefore: false,
  setupState: null,
  eligibility: null,
  myBid: null,
  pendingIndexing: false,
  clearingPriceUsd: 0.1,
}

// Verified + eligible (the Sonar session is complete) but no wallet yet: this is what
// unlocks the wallet gates and the bid tail under the verify-first ordering.
const verified: JourneyInput = {
  ...base,
  hasSonarSession: true,
  setupState: "complete",
  eligibility: "eligible",
}

// Verified + connected on the sale chain: ready to vary the bid tail.
const cleared: JourneyInput = {
  ...verified,
  isConnected: true,
  isSaleChain: true,
}

describe("deriveJourney - Verify gate is first and wallet-independent", () => {
  it("kyc-required for a brand-new visitor (no Sonar session, no wallet)", () => {
    expect(deriveJourney(base)).toBe("kyc-required")
  })
  it("kyc-required even with a wallet connected (verify precedes connect)", () => {
    expect(deriveJourney({ ...base, isConnected: true, isSaleChain: true })).toBe("kyc-required")
  })
  it("kyc-incomplete when the session is live but setup was never finished (user must act on Sonar)", () => {
    for (const s of ["not-started", "in-progress"] as const) {
      expect(deriveJourney({ ...base, hasSonarSession: true, setupState: s })).toBe(
        "kyc-incomplete",
      )
    }
  })
  it("kyc-incomplete when the session is live but Sonar has no entity yet (empty 404 answer)", () => {
    expect(deriveJourney({ ...base, hasSonarSession: true, setupState: null })).toBe(
      "kyc-incomplete",
    )
  })
  it("an empty answer on a browser that has seen a real entity is noise, not a setup ask", () => {
    // A transient empty read must never tell a verified user to redo setup - fall back to the
    // passive reconnect (kyc-required + returning -> "Welcome back"), which self-heals.
    expect(
      deriveJourney({ ...base, hasSonarSession: true, hadEntityBefore: true, setupState: null }),
    ).toBe("kyc-required")
  })
  it("real entity data saying not-started outranks the seen-before marker", () => {
    expect(
      deriveJourney({
        ...base,
        hasSonarSession: true,
        hadEntityBefore: true,
        setupState: "not-started",
      }),
    ).toBe("kyc-incomplete")
  })
  it("kyc-pending for an unrecognized setup state (passive fallback, no false setup CTA)", () => {
    expect(deriveJourney({ ...base, hasSonarSession: true, setupState: "unknown" })).toBe(
      "kyc-pending",
    )
  })
  it("kyc-incomplete beats the wallet gates (verify precedes connect)", () => {
    expect(
      deriveJourney({
        ...base,
        hasSonarSession: true,
        setupState: "not-started",
        isConnected: true,
        isSaleChain: true,
      }),
    ).toBe("kyc-incomplete")
  })
  it("kyc-pending only for the review states (waiting on Sonar, nothing to act on)", () => {
    for (const s of ["ready-for-review", "in-review"] as const) {
      expect(deriveJourney({ ...base, setupState: s })).toBe("kyc-pending")
    }
  })
  it("kyc-failed for every failure setup state, with or without a wallet", () => {
    for (const s of ["failure", "failure-final", "technical-issue"] as const) {
      expect(deriveJourney({ ...base, setupState: s })).toBe("kyc-failed")
    }
  })
  it("not-eligible surfaces before connect (no wallet needed to learn it)", () => {
    expect(deriveJourney({ ...base, setupState: "complete", eligibility: "not-eligible" })).toBe(
      "not-eligible",
    )
  })
})

describe("deriveJourney - wallet gates (reached only once verified + eligible)", () => {
  it("disconnected when verified but no wallet", () => {
    expect(deriveJourney(verified)).toBe("disconnected")
  })
  it("wrong-network when verified + connected off the sale chain", () => {
    expect(deriveJourney({ ...verified, isConnected: true, isSaleChain: false })).toBe(
      "wrong-network",
    )
  })
})

describe("deriveJourney - eligibility + bid tail", () => {
  it("ready when verified + connected + eligible + no bid", () => {
    expect(deriveJourney(cleared)).toBe("ready")
  })
  it("ready when setup complete but eligibility is unknown-setup-incomplete (only not-eligible blocks)", () => {
    expect(deriveJourney({ ...cleared, eligibility: "unknown-setup-incomplete" })).toBe("ready")
  })
  it("has-bid-winning when my price >= clearing", () => {
    expect(
      deriveJourney({
        ...cleared,
        myBid: { priceUsd: 0.2, committedUsd: 1000 },
        clearingPriceUsd: 0.15,
      }),
    ).toBe("has-bid-winning")
  })
  it("has-bid-outbid when my price < clearing", () => {
    expect(
      deriveJourney({
        ...cleared,
        myBid: { priceUsd: 0.1, committedUsd: 1000 },
        clearingPriceUsd: 0.15,
      }),
    ).toBe("has-bid-outbid")
  })
  it("has-bid-winning when nothing has cleared yet (clearing null)", () => {
    expect(
      deriveJourney({
        ...cleared,
        myBid: { priceUsd: 0.1, committedUsd: 1000 },
        clearingPriceUsd: null,
      }),
    ).toBe("has-bid-winning")
  })
  it("has-bid-pending overrides both Winning and Outbid while the bid is unreported", () => {
    // A confirmed-but-unreported bid must never claim a settled status (tag, tab alert, sections).
    for (const priceUsd of [0.2, 0.1]) {
      expect(
        deriveJourney({
          ...cleared,
          myBid: { priceUsd, committedUsd: 1000 },
          pendingIndexing: true,
          clearingPriceUsd: 0.15,
        }),
      ).toBe("has-bid-pending")
    }
  })
  it("pendingIndexing without a bid has no effect (ready)", () => {
    expect(deriveJourney({ ...cleared, pendingIndexing: true })).toBe("ready")
  })
})

describe("deriveJourney - guard precedence (earlier gate wins)", () => {
  it("kyc-failed beats not-eligible and the wallet gates", () => {
    expect(
      deriveJourney({
        ...base,
        setupState: "failure",
        eligibility: "not-eligible",
        isConnected: true,
        isSaleChain: true,
      }),
    ).toBe("kyc-failed")
  })
  it("not-eligible beats the wallet gates (verified but ineligible, off the sale chain)", () => {
    expect(
      deriveJourney({
        ...base,
        setupState: "complete",
        eligibility: "not-eligible",
        isConnected: true,
        isSaleChain: false,
      }),
    ).toBe("not-eligible")
  })
})

describe("derivePositionState - TokenDetails 'Your position' display", () => {
  const allStates: JourneyState[] = [
    "disconnected",
    "wrong-network",
    "kyc-required",
    "kyc-incomplete",
    "kyc-pending",
    "kyc-failed",
    "not-eligible",
    "ready",
    "has-bid-winning",
    "has-bid-outbid",
    "has-bid-pending",
  ]
  it("active whenever a bid exists, in any journey state", () => {
    for (const s of allStates) expect(derivePositionState(s, true)).toBe("active")
  })
  it("no-bids only when ready with no bid yet", () => {
    expect(derivePositionState("ready", false)).toBe("no-bids")
  })
  it("not-ready for every pre-ready state with no bid (incl. the fresh kyc-required visitor)", () => {
    for (const s of allStates.filter((s) => s !== "ready")) {
      expect(derivePositionState(s, false)).toBe("not-ready")
    }
  })
})

describe("isSonarVerified", () => {
  it("false before the Verify gate clears", () => {
    for (const s of UNVERIFIED) expect(isSonarVerified(s)).toBe(false)
  })
  it("true past the Verify gate", () => {
    for (const s of VERIFIED) expect(isSonarVerified(s)).toBe(true)
  })
})

describe("derivePreSaleBar - pre-sale sticky-bar state", () => {
  it("auth-error beats everything, in both stages", () => {
    expect(derivePreSaleBar("registration-closed", "kyc-required", "error")).toBe("auth-error")
    expect(derivePreSaleBar("registration-open", "ready", "error")).toBe("auth-error")
  })
  it("a known Sonar status beats the stage ask, in both stages", () => {
    for (const stage of ["registration-closed", "registration-open"] as const) {
      expect(derivePreSaleBar(stage, "kyc-incomplete", null)).toBe("incomplete")
      expect(derivePreSaleBar(stage, "kyc-pending", null)).toBe("pending")
      expect(derivePreSaleBar(stage, "kyc-failed", null)).toBe("failed")
      expect(derivePreSaleBar(stage, "not-eligible", null)).toBe("not-eligible")
    }
  })
  it("a verified user parks on registered, in both stages", () => {
    for (const stage of ["registration-closed", "registration-open"] as const) {
      for (const s of VERIFIED) expect(derivePreSaleBar(stage, s, null)).toBe("registered")
    }
  })
  it("a fresh visitor gets the stage ask", () => {
    expect(derivePreSaleBar("registration-closed", "kyc-required", null)).toBe("notify")
    expect(derivePreSaleBar("registration-open", "kyc-required", null)).toBe("register")
  })
  it('auth "ok" does not alter the derivation (entity refetch carries the change)', () => {
    expect(derivePreSaleBar("registration-closed", "kyc-required", "ok")).toBe("notify")
    expect(derivePreSaleBar("registration-open", "kyc-required", "ok")).toBe("register")
  })
})

describe("deriveJourney round-trips MOCK_JOURNEY_INPUTS", () => {
  for (const state of Object.keys(MOCK_JOURNEY_INPUTS) as JourneyState[]) {
    it(`mock "${state}" derives back to "${state}"`, () => {
      expect(deriveJourney(MOCK_JOURNEY_INPUTS[state])).toBe(state)
    })
  }
})
