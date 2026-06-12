/**
 * Preview fixtures for the /dev/states design harness and the dev-only `?journey=` /
 * `?phase=` overrides (SaleProvider, gated to non-production). PERMANENT dev tool,
 * not the swappable data mock: the mocks removed at launch live elsewhere (the Sonar
 * data seam lib/sonar/mock-*.ts and the on-chain emulation lib/sale/onchain.ts).
 * Pure UI fixtures, no secrets.
 */
import type { CommitmentData, JourneyInput, JourneyState } from "./types"

export const MOCK_COMMITMENT_LIVE: CommitmentData = {
  totalCommittedUsd: 1_200_000,
  clearingPriceUsd: 0.12,
  uniqueCommitmentCount: 1247,
  paused: false,
}

// One JourneyInput per JourneyState so /dev/states can render the whole funnel.
// Each entry derives back to its own key (see journey.test.ts round-trip).
export const MOCK_JOURNEY_INPUTS: Record<JourneyState, JourneyInput> = {
  disconnected: {
    isConnected: false,
    isBaseChain: false,
    // Verify-first: the Connect gate is only reached once verified + eligible.
    setupState: "complete",
    eligibility: "eligible",
    myBid: null,
    clearingPriceUsd: 0.12,
  },
  "wrong-network": {
    isConnected: true,
    isBaseChain: false,
    setupState: "complete",
    eligibility: "eligible",
    myBid: null,
    clearingPriceUsd: 0.12,
  },
  "kyc-required": {
    isConnected: true,
    isBaseChain: true,
    setupState: "not-started",
    eligibility: null,
    myBid: null,
    clearingPriceUsd: 0.12,
  },
  "kyc-pending": {
    isConnected: true,
    isBaseChain: true,
    setupState: "in-review",
    eligibility: null,
    myBid: null,
    clearingPriceUsd: 0.12,
  },
  "kyc-failed": {
    isConnected: true,
    isBaseChain: true,
    setupState: "failure-final",
    eligibility: null,
    myBid: null,
    clearingPriceUsd: 0.12,
  },
  "not-eligible": {
    isConnected: true,
    isBaseChain: true,
    setupState: "complete",
    eligibility: "not-eligible",
    myBid: null,
    clearingPriceUsd: 0.12,
  },
  ready: {
    isConnected: true,
    isBaseChain: true,
    setupState: "complete",
    eligibility: "eligible",
    myBid: null,
    clearingPriceUsd: 0.12,
  },
  "has-bid-winning": {
    isConnected: true,
    isBaseChain: true,
    setupState: "complete",
    eligibility: "eligible",
    // On the increment grid and under the $0.129 hardcap (a bid can never exceed
    // it), while still above the clearing so the state derives "winning".
    myBid: { priceUsd: 0.12255, committedUsd: 3200, lockup: false },
    clearingPriceUsd: 0.12,
  },
  "has-bid-outbid": {
    isConnected: true,
    isBaseChain: true,
    setupState: "complete",
    eligibility: "eligible",
    myBid: { priceUsd: 0.1, committedUsd: 3200, lockup: false },
    clearingPriceUsd: 0.12,
  },
}
