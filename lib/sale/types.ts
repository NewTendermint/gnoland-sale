// UI-facing shapes. Mirror @echoxyz/sonar-core@0.15.0 dist/index.d.ts; keep in sync.
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

// Mirrors sonar-core InvestingRegion enum (string values). "us" drives the forced lockup.
export type InvestingRegion = "unknown" | "other" | "us" | "eu"

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

// Live metrics plus the kill-switch flag. `paused` true = sale emergency-paused (mutating routes 503).
export type CommitmentData = CommitmentMetrics & {
  paused: boolean
}

// The session's Sonar entity reduced to what the journey needs (KYC + eligibility).
export type EntitySnapshot = {
  entityId: string
  setupState: EntitySetupState
  eligibility: SaleEligibility
  // Server-derived from Sonar EntityDetails.InvestingRegion; drives the forced US lockup at bid time.
  investingRegion: InvestingRegion
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
  | "kyc-incomplete"
  | "kyc-pending"
  | "kyc-failed"
  | "not-eligible"
  | "ready"
  | "has-bid-winning"
  | "has-bid-outbid"

// "Your position" display state, derived via derivePositionState (journey.ts).
export type PositionState = "not-ready" | "no-bids" | "active"

// Sonar OAuth return hint from ?auth=. Display-only: never an input to an auth decision.
export type SonarReturn = "ok" | "error" | null

// Pre-sale sticky-bar right-cluster state, derived by derivePreSaleBar (journey.ts).
export type PreSaleBarState =
  | "notify"
  | "register"
  | "incomplete"
  | "pending"
  | "failed"
  | "not-eligible"
  | "registered"
  | "auth-error"

// Inputs the journey deriver needs (no readyToPurchase: that gating lives in the bid step).
export type JourneyInput = {
  isConnected: boolean
  isSaleChain: boolean
  setupState: EntitySetupState | null
  eligibility: SaleEligibility | null
  myBid: MyBid
  clearingPriceUsd: number | null
}

// Result of the bid-step pre-purchase check. Mirrors sonar-core PrePurchaseCheckResponse, normalized.
export type PrePurchaseResult =
  | { readyToPurchase: true }
  | {
      readyToPurchase: false
      failureReason: PrePurchaseFailureReason
      livenessCheckUrl?: string
    }

// Mirrors sonar-core BasicPermitV3 (dist/index.d.ts l.75-87). Sonar issues this for our V3 sale;
// permit-map.ts maps it to the contract's PurchasePermitV3 struct. Hex fields are 0x strings,
// amounts/prices/timestamps arrive as JSON numbers/strings and become bigints on the way in.
export type SonarPermitV3 = {
  SaleSpecificEntityID: string
  SaleUUID: string
  Wallet: string
  ExpiresAt: number
  MinAmount: string
  MaxAmount: string
  MinPrice: number
  MaxPrice: number
  OpensAt: number
  ClosesAt: number
  Payload: string
}

// Purchase permit from /api/sonar/generate-permit, forwarded to replaceBidWithPermit.
export type SalePermit = {
  PermitJSON: SonarPermitV3
  Signature: string
}
