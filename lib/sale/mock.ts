// Preview fixtures for the /dev/states harness and the dev-only ?journey= / ?phase= overrides.
import type { CommitmentData, JourneyInput, JourneyState } from "./types"

export const MOCK_COMMITMENT_LIVE: CommitmentData = {
  totalCommittedUsd: 1_200_000,
  clearingPriceUsd: 0.0774,
  uniqueCommitmentCount: 1247,
  paused: false,
}

// One JourneyInput per JourneyState so /dev/states can render the whole funnel.
export const MOCK_JOURNEY_INPUTS: Record<JourneyState, JourneyInput> = {
  disconnected: {
    isConnected: false,
    isBaseChain: false,
    setupState: "complete",
    eligibility: "eligible",
    myBid: null,
    clearingPriceUsd: 0.0774,
  },
  "wrong-network": {
    isConnected: true,
    isBaseChain: false,
    setupState: "complete",
    eligibility: "eligible",
    myBid: null,
    clearingPriceUsd: 0.0774,
  },
  "kyc-required": {
    isConnected: true,
    isBaseChain: true,
    setupState: "not-started",
    eligibility: null,
    myBid: null,
    clearingPriceUsd: 0.0774,
  },
  "kyc-pending": {
    isConnected: true,
    isBaseChain: true,
    setupState: "in-review",
    eligibility: null,
    myBid: null,
    clearingPriceUsd: 0.0774,
  },
  "kyc-failed": {
    isConnected: true,
    isBaseChain: true,
    setupState: "failure-final",
    eligibility: null,
    myBid: null,
    clearingPriceUsd: 0.0774,
  },
  "not-eligible": {
    isConnected: true,
    isBaseChain: true,
    setupState: "complete",
    eligibility: "not-eligible",
    myBid: null,
    clearingPriceUsd: 0.0774,
  },
  ready: {
    isConnected: true,
    isBaseChain: true,
    setupState: "complete",
    eligibility: "eligible",
    myBid: null,
    clearingPriceUsd: 0.0774,
  },
  "has-bid-winning": {
    isConnected: true,
    isBaseChain: true,
    setupState: "complete",
    eligibility: "eligible",
    myBid: { priceUsd: 0.0903, committedUsd: 3200, lockup: false },
    clearingPriceUsd: 0.0774,
  },
  "has-bid-outbid": {
    isConnected: true,
    isBaseChain: true,
    setupState: "complete",
    eligibility: "eligible",
    myBid: { priceUsd: 0.07095, committedUsd: 3200, lockup: false },
    clearingPriceUsd: 0.0774,
  },
}
