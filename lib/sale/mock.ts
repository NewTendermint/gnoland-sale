import type { CommitmentData, JourneyInput, JourneyState } from "./types"

export const MOCK_COMMITMENT_LIVE: CommitmentData = {
  totalCommittedUsd: 1_200_000,
  clearingPriceUsd: 0.12,
  uniqueCommitmentCount: 1247,
}

// One JourneyInput per JourneyState, so /dev/states can render the whole funnel.
// Each entry is constructed to derive back to its own key (see journey.test.ts round-trip).
export const MOCK_JOURNEY_INPUTS: Record<JourneyState, JourneyInput> = {
  disconnected: {
    isConnected: false,
    isBaseChain: false,
    setupState: null,
    eligibility: null,
    myBid: null,
    clearingPriceUsd: 0.12,
  },
  "wrong-network": {
    isConnected: true,
    isBaseChain: false,
    setupState: null,
    eligibility: null,
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
    myBid: { priceUsd: 0.18, committedUsd: 3200, lockup: false },
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
