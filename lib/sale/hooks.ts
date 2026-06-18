"use client"

// Client data hooks the UI binds to; each wraps a ./api fetcher in TanStack Query.
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
import { type ClaimResult, claimRefundOnChain, submitBidOnChain } from "./onchain"
import type { BidParams, BidResult } from "./submitter"
import type { CommitmentData, MyBid } from "./types"

// Neutral zeros until the first fetch resolves; as initialData, types `data` as always-defined.
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

/** The session's Sonar entity (KYC + eligibility); `data` is null when not connected. */
export function useEntity(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["sale", "entity"],
    queryFn: getEntity,
    enabled: opts?.enabled ?? true,
  })
}

/** The session's current position (price + committed); `data` is null when none. */
export function useMyBid(opts?: { enabled?: boolean }) {
  const { isConnected } = useAccount()
  return useQuery({
    queryKey: ["sale", "my-bid"],
    queryFn: getMyPosition,
    enabled: isConnected && (opts?.enabled ?? true),
    // TODO(real-data): invalidate this after a real bid so readMyBid confirms the indexed commitment.
    refetchOnWindowFocus: false,
  })
}

/** True only for a well-formed https: URL; guards against a javascript:/data: redirect sink. */
function isSafeHttpUrl(value: string | undefined): value is string {
  if (!value) return false
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

/** Bid submission: Sonar pre-purchase + permit gates, then submitBidOnChain. */
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
        // Validate the scheme before navigating (untrusted upstream value).
        // TODO(real-data): tighten to a host allowlist once the liveness vendor's host is confirmed against Sonar.
        if (pre.failureReason === "requires-liveness" && isSafeHttpUrl(pre.livenessCheckUrl)) {
          window.location.href = pre.livenessCheckUrl
        }
        return { status: "reverted", reason: pre.failureReason }
      }
      const permit = await postGeneratePermit(address)
      const result = await submitBidOnChain({ params, permit, wallet: address })
      if (result.status === "submitted") {
        // Optimistic: reflect the just-placed bid as the session's position.
        // TODO(real-data): also invalidate ["sale","my-bid"] to refetch the confirmed commitment from Sonar once it indexes.
        const optimistic: MyBid = {
          priceUsd: params.priceUsd,
          committedUsd: params.amountUsd,
          lockup: params.lockup,
        }
        queryClient.setQueryData(["sale", "my-bid"], optimistic)
      }
      return result
    } catch (err) {
      // 401 means the Sonar session is gone: reconnect, not retry.
      if (err instanceof HttpError && err.status === 401) {
        return { status: "reverted", reason: "session-expired" }
      }
      return { status: "reverted", reason: "Could not place bid" }
    }
  }

  return { submit }
}

/** Refund claim for the ended phase: hands off to claimRefundOnChain, no Sonar gate. */
export function useClaim() {
  const { address } = useAccount()

  async function claim(): Promise<ClaimResult> {
    if (!address) {
      return { status: "reverted", reason: "Connect your wallet" }
    }
    try {
      return await claimRefundOnChain({ wallet: address })
    } catch {
      return { status: "reverted", reason: "Could not claim your refund" }
    }
  }

  return { claim }
}
