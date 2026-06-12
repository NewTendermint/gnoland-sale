import { bidStatus } from "./calc"
import type { EntitySetupState, JourneyInput, JourneyState, PositionState } from "./types"

// Sonar EntitySetupState buckets
const PENDING_SETUP: EntitySetupState[] = ["in-progress", "ready-for-review", "in-review"]
const FAILED_SETUP: EntitySetupState[] = ["failure", "failure-final", "technical-issue"]

/**
 * Per-user funnel state for the LIVE phase. Ordering matters: each guard assumes
 * the previous one failed. Verify-first: the Sonar KYC + eligibility gate is checked
 * BEFORE the wallet gate, because verification is wallet-independent (it comes from
 * the OAuth session via the eager useEntity query) and can be done ahead of the sale.
 * So Verify -> Connect -> Bid, and a returning verified user auto-skips Verify. Maps
 * Sonar EntitySetupState + SaleEligibility + a price compare onto the funnel; see
 * docs/specs/2026-06-01-sonar-feasibility-and-sale-states.md §7.2.
 *
 * The fine-grained pre-purchase blockers (PrePurchaseFailureReason: wallet-risk,
 * requires-liveness, max-wallets-used, sale-not-active, outside-time-window) are NOT
 * modeled here. They are per-attempt and surface in the bid step (PreflightGates),
 * mirroring the SDK's useSonarPurchase which runs prePurchaseCheck at purchase time.
 * That is why JourneyInput carries no readyToPurchase flag.
 *
 * TODO(sonar): failure / failure-final / technical-issue currently fold into one
 * kyc-failed node; confirm retry vs terminal vs transient semantics per state.
 */
export function deriveJourney(i: JourneyInput): JourneyState {
  // Verify gate first - wallet-independent, driven by the Sonar session (entity).
  // A returning verified user (setupState "complete") clears this whole block before
  // any wallet is connected, so the funnel auto-skips Verify straight to Connect.
  if (i.setupState && FAILED_SETUP.includes(i.setupState)) return "kyc-failed"
  if (i.setupState && PENDING_SETUP.includes(i.setupState)) return "kyc-pending"
  if (i.setupState !== "complete") return "kyc-required" // null, not-started, or future-unknown
  if (i.eligibility === "not-eligible") return "not-eligible"
  // Verified + eligible. Now the wallet gate.
  if (!i.isConnected) return "disconnected"
  if (!i.isBaseChain) return "wrong-network"
  if (i.myBid) {
    return bidStatus(i.myBid.priceUsd, i.clearingPriceUsd) === "outbid"
      ? "has-bid-outbid"
      : "has-bid-winning"
  }
  return "ready"
}

/**
 * The TokenDetails "Your position" display state. A placed bid shows the active
 * position; a "ready" user (verified + connected + eligible) with no bid is invited to
 * place their first; everyone earlier in the funnel is "not-ready". Verify-first: gate
 * "place your first bid" on "ready", NOT "disconnected" - a fresh visitor is now
 * "kyc-required", so keying off "disconnected" would mislabel them.
 */
export function derivePositionState(journey: JourneyState, hasBid: boolean): PositionState {
  if (hasBid) return "active"
  if (journey === "ready") return "no-bids"
  return "not-ready"
}
