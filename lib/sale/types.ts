/**
 * UI-facing shapes. They mirror the fields we consume from Sonar so the UI binds
 * to these and swapping mocks for the real server proxy is a transport change.
 * Source: @echoxyz/sonar-core@0.15.0 dist/index.d.ts
 * (see docs/specs/2026-06-01-sonar-feasibility-and-sale-states.md).
 */
export type SalePhase = "pre-sale" | "live" | "ended"
export type PreSaleStage = "registration-closed" | "registration-open"

// Mirrors sonar-core EntitySetupState (8 states)
export type EntitySetupState =
  | "not-started"
  | "in-progress"
  | "ready-for-review"
  | "in-review"
  | "failure"
  | "failure-final"
  | "technical-issue"
  | "complete"

// Mirrors sonar-core SaleEligibility
export type SaleEligibility = "eligible" | "not-eligible" | "unknown-setup-incomplete"

// Mirrors sonar-core PrePurchaseFailureReason (7 reasons)
export type PrePurchaseFailureReason =
  | "unknown"
  | "wallet-risk"
  | "max-wallets-used"
  | "requires-liveness"
  | "sale-not-active"
  | "wallet-not-linked"
  | "outside-time-window"

// Subset of ReadCommitmentDataResponse we render, normalized to USD numbers
export type CommitmentMetrics = {
  totalCommittedUsd: number
  clearingPriceUsd: number | null // null before any clears
  uniqueCommitmentCount: number
}

// Live metrics plus our kill-switch flag. `paused` (from SALE_PAUSED, added by the
// commitments route) true means the sale is emergency-paused: the bid UI shows a
// paused state and the mutating routes already return 503.
export type CommitmentData = CommitmentMetrics & {
  paused: boolean
}

// The session's Sonar entity reduced to what the journey needs (KYC + eligibility).
export type EntitySnapshot = {
  entityId: string
  setupState: EntitySetupState
  eligibility: SaleEligibility
}

// Derived from filtering Commitments[] by my SaleSpecificEntityID
export type MyBid = {
  priceUsd: number
  committedUsd: number
  lockup: boolean
} | null

export type JourneyState =
  | "disconnected"
  | "wrong-network"
  | "kyc-required"
  | "kyc-pending"
  | "kyc-failed"
  | "not-eligible"
  | "ready"
  | "has-bid-winning"
  | "has-bid-outbid"

// The TokenDetails "Your position" block reduces the journey to three display states:
// not-ready (earlier in the funnel, prompt to get set up), no-bids (ready, no bid yet),
// active (a bid is placed). Derived + unit-tested via derivePositionState (journey.ts).
export type PositionState = "not-ready" | "no-bids" | "active"

// Sonar OAuth return hint, read once from ?auth= on the callback redirect then
// stripped from the URL. Display-only by design: "ok" just refetches the entity
// (the journey moves only when the server-confirmed status lands) and "error"
// surfaces a notice. It is never an input to an auth decision.
export type SonarReturn = "ok" | "error" | null

// Pre-sale sticky-bar right-cluster state, derived by derivePreSaleBar (journey.ts):
// the stage ask (notify before registration opens, register after) unless the user
// already has a Sonar status to show, or just bounced back from OAuth with an error.
export type PreSaleBarState =
  | "notify"
  | "register"
  | "pending"
  | "failed"
  | "not-eligible"
  | "registered"
  | "auth-error"

// Inputs the journey deriver needs. No readyToPurchase here: the per-attempt
// pre-purchase gating lives in the bid step (PreflightGates), mirroring Sonar's
// useSonarPurchase. See journey.ts + spec §7.2.
export type JourneyInput = {
  isConnected: boolean
  isBaseChain: boolean
  setupState: EntitySetupState | null
  eligibility: SaleEligibility | null
  myBid: MyBid
  clearingPriceUsd: number | null
}

/**
 * Result of the bid-step pre-purchase check (where readyToPurchase now lives).
 * Mirrors sonar-core PrePurchaseCheckResponse, normalized. Consumed by
 * PreflightGates (plan Task 9), not by the journey deriver.
 */
export type PrePurchaseResult =
  | { readyToPurchase: true }
  | {
      readyToPurchase: false
      failureReason: PrePurchaseFailureReason
      livenessCheckUrl?: string
    }

/**
 * The purchase permit from /api/sonar/generate-permit, forwarded as-is to the
 * on-chain replaceBidWithPermit call (lib/sale/onchain.ts). PermitJSON is Sonar's
 * BasicPermitV3; its exact mapping to the contract's PurchasePermitV3 tuple is wired
 * when the contract lands (REQUIREMENTS A.1), so it stays `unknown` here. Signature
 * is the purchasePermitSignature bytes the contract verifies.
 */
export type SalePermit = {
  PermitJSON: unknown
  Signature: string
}
