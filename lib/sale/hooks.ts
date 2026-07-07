"use client"

// Client data hooks the UI binds to; each wraps a ./api fetcher in TanStack Query.
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useAccount } from "wagmi"
import {
  type EntityRead,
  HttpError,
  getCommitments,
  postGeneratePermit,
  postPrePurchase,
} from "./api"
import { forceLockupForRegion } from "./calc"
import { readEntity, readMyPosition } from "./confirmed-read"
import { SALE_CHAIN, saleContractsFor } from "./contracts"
import {
  type ClaimResult,
  claimRefundOnChain,
  readClaimGate,
  resolvePaymentTokens,
  submitBidOnChain,
} from "./onchain"
import { reconcilePendingBid, usePendingBid, writePendingBid } from "./pending-bid"
import { sonarQueryRetry, sonarQueryRetryDelay } from "./query-retry"
import type { BidParams, BidResult, BidStage } from "./submitter"
import type { CommitmentData } from "./types"

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
    // Footgun: without this the poll pauses on blur and the TabAlert outbid overlay (which exists
    // FOR backgrounded tabs) can never fire on data that arrives while hidden.
    refetchIntervalInBackground: true,
    initialData: EMPTY_COMMITMENT,
  })
}

/** The session's Sonar entity read (KYC + eligibility), discriminated by session/entity presence. */
export function useEntity(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["sale", "entity"],
    // Empty-confirming read (see confirmed-read): a no-entity answer is re-read unconditionally,
    // a no-session answer only on a browser that has seen an entity - one transient empty
    // upstream answer must not stick as a false status.
    queryFn: () => readEntity(),
    enabled: opts?.enabled ?? true,
    retry: sonarQueryRetry,
    retryDelay: sonarQueryRetryDelay,
  })
}

/** The session's raw Sonar position (price + committed); `data` is null when none, undefined
 *  while unresolved. `pending` is the wallet's confirmed-but-unreported bid (stable reference);
 *  SaleProvider derives the displayed overlay from both via derivePendingView. */
export function useMyBid(opts?: { enabled?: boolean }) {
  const { isConnected, address } = useAccount()
  const pending = usePendingBid(address)
  const queryClient = useQueryClient()
  // A disconnected wallet must not keep showing the previous session's position (the query is
  // merely disabled, its cache would survive and the journey would still read "Raise bid").
  // Footgun: removeQueries, not resetQueries - reset refetches through enabled:false and the
  // Sonar session (still alive server-side) would repopulate the position we just cleared.
  useEffect(() => {
    if (isConnected) return
    queryClient.removeQueries({ queryKey: ["sale", "my-bid"] })
  }, [isConnected, queryClient])
  const query = useQuery({
    queryKey: ["sale", "my-bid"],
    // Null-confirming read (see confirmed-read): an unexpected null while this browser has a bid
    // is re-read before being trusted - one transient empty answer must not stick as "no bid".
    queryFn: () => readMyPosition(),
    enabled: isConnected && (opts?.enabled ?? true),
    refetchOnWindowFocus: false,
    // Poll only while a pending bid waits for Sonar's cache (10s, the commitments cadence), so
    // the reconcile below purges it as soon as Sonar reports the amount.
    refetchInterval: pending ? 10_000 : false,
    retry: sonarQueryRetry,
    retryDelay: sonarQueryRetryDelay,
  })
  // Footgun: reconcile must live in an effect, not the queryFn - a fetch-side effect would run on
  // every retry and capture a stale wallet address across an account switch.
  const settled = query.data
  useEffect(() => {
    if (settled === undefined) return
    reconcilePendingBid(settled, address)
  }, [settled, address])
  return { ...query, pending }
}

/** The sale's registered payment tokens (immutable on-chain -> cached for the session). Resolves
 *  only on the sale chain with a configured contract; `data` stays undefined elsewhere. */
export function usePaymentTokens() {
  const { chainId } = useAccount()
  const contracts = saleContractsFor(chainId)
  return useQuery({
    queryKey: ["sale", "payment-tokens", chainId],
    queryFn: () =>
      resolvePaymentTokens(contracts?.settlementSale as `0x${string}`, chainId as number),
    enabled: chainId === SALE_CHAIN.id && Boolean(contracts),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
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

// Module-level so the guard survives a BidFlow remount (panel collapse/expand). One bidder per client.
let bidInFlight = false

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
    // Cross-remount double-submit guard: a second bid while one tx is pending would sign against a
    // stale USDC nonce and revert on-chain (wasted gas). Module-level so it persists across remounts.
    if (bidInFlight) {
      return { status: "reverted", reason: "A bid is already in progress" }
    }
    bidInFlight = true
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
      const read = queryClient.getQueryData<EntityRead>(["sale", "entity"])
      const region = read?.status === "entity" ? read.entity.investingRegion : undefined
      const bidParams: BidParams = {
        ...params,
        lockup: forceLockupForRegion(region) || params.lockup,
      }
      const permit = await postGeneratePermit(address)
      const result = await submitBidOnChain({
        params: bidParams,
        permit,
        wallet: address,
        onStage: opts?.onStage,
      })
      if (result.status === "submitted") {
        // Footgun: never setQueryData(["sale","my-bid"]) here - the pending-bid store is the only
        // optimistic layer, and the query cache must stay Sonar's real answer (the delta baseline).
        writePendingBid(
          {
            priceUsd: bidParams.priceUsd,
            committedUsd: bidParams.amountUsd,
            lockup: bidParams.lockup,
          },
          address,
        )
      }
      return result
    } catch (err) {
      // 401 means the Sonar session is gone: reconnect, not retry.
      if (err instanceof HttpError && err.status === 401) {
        return { status: "reverted", reason: "session-expired" }
      }
      // 403 = the server-side eligibility gate (bid-request.ts): retrying cannot help.
      if (err instanceof HttpError && err.status === 403) {
        return { status: "reverted", reason: "entity-not-eligible" }
      }
      return { status: "reverted", reason: "Could not place bid" }
    } finally {
      bidInFlight = false
    }
  }

  return { submit }
}

/** The on-chain refund claim gate for the ended phase (stage/claimRefundEnabled/refundable).
 *  `data` stays undefined while unresolved or without a wallet; the UI hides the claim button
 *  until the contract confirms the self-serve window is open (fail-closed). */
export function useClaimGate(opts?: { enabled?: boolean }) {
  const { address } = useAccount()
  return useQuery({
    queryKey: ["sale", "claim-gate", address],
    queryFn: () => readClaimGate(address as `0x${string}`),
    enabled: Boolean(address) && (opts?.enabled ?? true),
    staleTime: 60_000,
    // The gate flips rarely (stage transitions, admin toggle); once refunded it can never change
    // again, so stop polling then.
    refetchInterval: (query) => (query.state.data?.refunded ? false : 60_000),
  })
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
