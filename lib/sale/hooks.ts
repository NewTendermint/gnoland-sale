"use client"

/**
 * Client data hooks: the coherent front API the UI binds to. Each wraps a
 * fetcher from ./api in TanStack Query (the client already mounts a
 * QueryClient via Web3Provider). Components consume these (or useSale) and never
 * see the transport; swapping mock <-> real Sonar changes nothing here.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import {
  HttpError,
  getCommitments,
  getEntity,
  getMyPosition,
  postGeneratePermit,
  postPrePurchase,
} from "./api"
import { submitBidOnChain } from "./onchain"
import type { BidParams, BidResult } from "./submitter"
import type { CommitmentData, MyBid } from "./types"

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
 * The session's current position (price + committed); `data` is null when the
 * entity has no commitment or is not connected to Sonar. Feeds `myBid` in the
 * journey + the position UI.
 */
export function useMyBid() {
  return useQuery({
    queryKey: ["sale", "my-bid"],
    queryFn: getMyPosition,
    // Don't clobber an optimistic post-bid position (set by useBid) on window focus;
    // the mock has no server-side commitment to refetch. TODO(real-data): invalidate
    // this after a real bid so readMyBid confirms the indexed commitment.
    refetchOnWindowFocus: false,
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
  const queryClient = useQueryClient()

  async function submit(params: BidParams): Promise<BidResult> {
    if (!address) {
      return { status: "reverted", reason: "Connect your wallet" }
    }
    try {
      const pre = await postPrePurchase(address)
      if (!pre.readyToPurchase) {
        // requires-liveness ships a hosted Sonar URL; send the user there to clear
        // the identity check, then they return and retry the bid.
        if (pre.failureReason === "requires-liveness" && pre.livenessCheckUrl) {
          window.location.href = pre.livenessCheckUrl
        }
        return { status: "reverted", reason: pre.failureReason }
      }
      const permit = await postGeneratePermit(address)
      const result = await submitBidOnChain({ params, permit, wallet: address })
      if (result.status === "submitted") {
        // Optimistic: reflect the just-placed bid as the session's position so the UI
        // moves to has-bid right away (no "winning" before a bid; no empty state after
        // one). TODO(real-data): also invalidate ["sale","my-bid"] to refetch the
        // confirmed commitment from Sonar once it indexes.
        const optimistic: MyBid = {
          priceUsd: params.priceUsd,
          committedUsd: params.amountUsd,
          lockup: params.lockup,
        }
        queryClient.setQueryData(["sale", "my-bid"], optimistic)
      }
      return result
    } catch (err) {
      // A 401 means the Sonar session is gone (revoked / expired beyond refresh):
      // the user must reconnect, not retry. Other failures (502 / network) revert
      // to a generic retry so the CTA never hangs on "Signing...".
      if (err instanceof HttpError && err.status === 401) {
        return { status: "reverted", reason: "session-expired" }
      }
      return { status: "reverted", reason: "Could not place bid" }
    }
  }

  return { submit }
}
