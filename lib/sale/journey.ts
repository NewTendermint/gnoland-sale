import { bidStatus } from "./calc"
import type {
  EntitySetupState,
  JourneyInput,
  JourneyState,
  PositionState,
  PreSaleBarState,
  PreSaleStage,
  SonarReturn,
} from "./types"

// States where the user still has setup work to finish ON SONAR (re-running OAuth cannot advance
// them - the CTA must link out to the hosted setup page, app.echo.xyz/sonar/{saleUUID}).
const INCOMPLETE_SETUP: EntitySetupState[] = ["not-started", "in-progress"]
// "unknown" (an unrecognized upstream value) rides with the passive wait states: a false
// "finish your setup" claim to a possibly-verified user is worse than a false "in review".
const PENDING_SETUP: EntitySetupState[] = ["ready-for-review", "in-review", "unknown"]
const FAILED_SETUP: EntitySetupState[] = ["failure", "failure-final", "technical-issue"]

/**
 * Per-user funnel state for the LIVE phase (verify-first: Verify -> Connect -> Bid).
 * Ordering matters: each guard assumes the previous one failed.
 *
 * TODO(sonar): failure / failure-final / technical-issue currently fold into one
 * kyc-failed node; confirm retry vs terminal vs transient semantics per state.
 */
export function deriveJourney(i: JourneyInput): JourneyState {
  if (i.setupState && FAILED_SETUP.includes(i.setupState)) return "kyc-failed"
  if (i.setupState && INCOMPLETE_SETUP.includes(i.setupState)) return "kyc-incomplete"
  if (i.setupState && PENDING_SETUP.includes(i.setupState)) return "kyc-pending"
  // null setupState = no entity data. With a live session (a 404 empty answer) the user still
  // has to START setup on Sonar; without one, (re)connecting via OAuth is the correct ask.
  if (i.setupState !== "complete") return i.hasSonarSession ? "kyc-incomplete" : "kyc-required"
  if (i.eligibility === "not-eligible") return "not-eligible"
  if (!i.isConnected) return "disconnected"
  if (!i.isSaleChain) return "wrong-network"
  if (i.myBid) {
    return bidStatus(i.myBid.priceUsd, i.clearingPriceUsd) === "outbid"
      ? "has-bid-outbid"
      : "has-bid-winning"
  }
  return "ready"
}

/** The TokenDetails "Your position" display state: active / no-bids / not-ready. */
export function derivePositionState(journey: JourneyState, hasBid: boolean): PositionState {
  if (hasBid) return "active"
  if (journey === "ready") return "no-bids"
  return "not-ready"
}

// Journey states that have NOT cleared the Verify gate.
const UNVERIFIED_JOURNEYS: JourneyState[] = [
  "kyc-required",
  "kyc-incomplete",
  "kyc-pending",
  "kyc-failed",
  "not-eligible",
]

/** True once the journey is past the Verify gate (Sonar setup complete + eligible). */
export function isSonarVerified(journey: JourneyState): boolean {
  return !UNVERIFIED_JOURNEYS.includes(journey)
}

/** Pre-sale sticky-bar state (precedence: auth-error -> known Sonar status -> stage ask). */
export function derivePreSaleBar(
  stage: PreSaleStage,
  journey: JourneyState,
  sonarReturn: SonarReturn,
): PreSaleBarState {
  if (sonarReturn === "error") return "auth-error"
  if (journey === "kyc-incomplete") return "incomplete"
  if (journey === "kyc-pending") return "pending"
  if (journey === "kyc-failed") return "failed"
  if (journey === "not-eligible") return "not-eligible"
  if (isSonarVerified(journey)) return "registered"
  return stage === "registration-open" ? "register" : "notify"
}
