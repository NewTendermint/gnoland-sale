"use client"

/**
 * Client data hooks: the coherent front API the UI binds to. Each wraps a
 * fetcher from ./api in TanStack Query (the client already mounts a
 * QueryClient via Web3Provider). Components consume these (or useSale) and never
 * see the transport; swapping mock <-> real Sonar changes nothing here.
 */
import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { getCommitments, getEntity, postGeneratePermit, postPrePurchase } from "./api"
import { submitBidOnChain } from "./onchain"
import type { BidParams, BidResult } from "./submitter"
import type { CommitmentData } from "./types"

// Neutral initial value (never fake numbers) shown until the first fetch
// resolves; using initialData also makes `data` typed as always-defined.
const EMPTY_COMMITMENT: CommitmentData = {
  totalCommittedUsd: 0,
  clearingPriceUsd: null,
  uniqueCommitmentCount: 0,
  paused: false,
}

/** Live auction metrics, polled every 10s (matches the route's cache window). */
export function useSaleData() {
  return useQuery({
    queryKey: ["sale", "commitments"],
    queryFn: getCommitments,
    refetchInterval: 10_000,
    initialData: EMPTY_COMMITMENT,
  })
}

/**
 * The session's Sonar entity (KYC + eligibility); `data` is null when the user
 * is not connected to Sonar. Feeds the journey via deriveJourney.
 */
export function useEntity() {
  return useQuery({
    queryKey: ["sale", "entity"],
    queryFn: getEntity,
  })
}

/**
 * Bid submission. Runs the real Sonar gates (pre-purchase check -> generate
 * permit) for the connected wallet, then hands the permit to the on-chain step.
 * That on-chain step (EIP-2612 signature + replaceBidWithPermit) lives behind the
 * single swap point submitBidOnChain (lib/sale/onchain.ts), emulated off-chain in
 * dev until the SettlementSale contract is deployed. Nothing here changes at go-live.
 */
export function useBid() {
  const { address } = useAccount()

  async function submit(params: BidParams): Promise<BidResult> {
    if (!address) {
      return { status: "reverted", reason: "Connect your wallet" }
    }
    try {
      const pre = await postPrePurchase(address)
      if (!pre.readyToPurchase) {
        return { status: "reverted", reason: pre.failureReason }
      }
      const permit = await postGeneratePermit(address)
      return submitBidOnChain({ params, permit, wallet: address })
    } catch {
      // A thrown fetcher error (a 401 re-auth, 502, or network failure) must not
      // leave the CTA stuck "Signing...". Reset to a reverted result. Surfacing a
      // 401-specific "reconnect with Sonar" prompt is a follow-on (needs the
      // fetcher to expose status + BidFlow to render the reverted reason).
      return { status: "reverted", reason: "Could not place bid" }
    }
  }

  return { submit }
}
