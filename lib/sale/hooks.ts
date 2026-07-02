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
import { forceLockupForRegion } from "./calc"
import { type ClaimResult, claimRefundOnChain, submitBidOnChain } from "./onchain"
import { sonarQueryRetry, sonarQueryRetryDelay } from "./query-retry"
import type { BidParams, BidResult, BidStage } from "./submitter"
import type { CommitmentData, EntitySnapshot, MyBid } from "./types"

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
    retry: sonarQueryRetry,
    retryDelay: sonarQueryRetryDelay,
  })
}

/** The session's current position (price + committed); `data` is null when none. */
export function useMyBid(opts?: { enabled?: boolean }) {
  const { isConnected } = useAccount()
  return useQuery({
    queryKey: ["sale", "my-bid"],
    queryFn: getMyPosition,
    enabled: isConnected && (opts?.enabled ?? true),
    // useBid marks this stale (refetchType:"none") after a submit; it reconciles with the indexed
    // commitment on remount. Off window-focus to avoid churn while the panel stays mounted.
    refetchOnWindowFocus: false,
    retry: sonarQueryRetry,
    retryDelay: sonarQueryRetryDelay,
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

  async function submit(
    params: BidParams,
    opts?: { onStage?: (s: BidStage) => void },
  ): Promise<BidResult> {
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
      // Compliance: a US entity must carry the on-chain lockup flag - read the region from the
      // trusted server entity snapshot (query cache), never from client UI state, and force it on.
      // The contract rejects a US commitment without it (BidMustHaveLockup).
      const entity = queryClient.getQueryData<EntitySnapshot>(["sale", "entity"])
      const bidParams: BidParams = {
        ...params,
        lockup: forceLockupForRegion(entity?.investingRegion) || params.lockup,
      }
      const permit = await postGeneratePermit(address)
      const result = await submitBidOnChain({
        params: bidParams,
        permit,
        wallet: address,
        onStage: opts?.onStage,
      })
      if (result.status === "submitted") {
        // Optimistic: reflect the just-placed bid as the session's position.
        const optimistic: MyBid = {
          priceUsd: bidParams.priceUsd,
          committedUsd: bidParams.amountUsd,
          lockup: bidParams.lockup,
        }
        queryClient.setQueryData(["sale", "my-bid"], optimistic)
        // Mark the position stale so it reconciles with Sonar's indexed commitment on the next
        // observe (remount), WITHOUT an immediate refetch that could clobber this optimistic value
        // before indexing completes (indexing latency is unknown; no arbitrary timeout).
        queryClient.invalidateQueries({ queryKey: ["sale", "my-bid"], refetchType: "none" })
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
