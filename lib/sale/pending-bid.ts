"use client"

import { useEffect, useMemo, useReducer, useSyncExternalStore } from "react"
import type { MyBid, PendingBidDelta } from "./types"

// The just-confirmed bid, persisted until Sonar's read reflects it (readCommitmentData is served
// from a ~1min cache, per Echo on issue #14): keeps the position visible across a reload and
// feeds the "pending" chips next to the aggregate metrics. This is the ONLY optimistic layer for
// the position (useBid does not write the query cache). Amounts stay in this browser (already
// visible in the user's wallet), never sent anywhere.
const KEY = "gnot:pending-bid"
// Same-tab notify: the `storage` event only fires in OTHER tabs, so write/clear emit this too.
const CHANGE_EVENT = "gnot:pending-bid-change"

// Wide margin over Sonar's ~1min read cache; past it the page falls back to Sonar only.
export const PENDING_BID_TTL_MS = 10 * 60 * 1000

// In-memory fallback when localStorage is blocked (private mode): the overlay still works for
// the session that placed the bid, it just does not survive a reload.
let memoryRaw: string | null = null

export type PendingBid = {
  // Absolute new ENTITY total (replaceBid semantics: the on-chain bid replaces the entity's bid,
  // and Sonar's position is the same entity total) - never an increment, so rapid raises just
  // overwrite and the reconcile comparison below is scope-consistent.
  committedUsd: number
  priceUsd: number
  lockup: boolean
  address: string
  timestamp: number
}

// What the UI derives from a pending bid, in ONE place: the displayed position, whether status
// claims must stay neutral, and the chip delta. Never derive these independently elsewhere.
export type PendingView = {
  myBid: MyBid
  pendingIndexing: boolean
  delta: PendingBidDelta | null
}

function emitChange(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Persist the just-confirmed bid (memory fallback if storage is blocked). */
export function writePendingBid(
  bid: { committedUsd: number; priceUsd: number; lockup: boolean },
  address: string,
): void {
  const entry: PendingBid = {
    ...bid,
    address: address.toLowerCase(),
    timestamp: Date.now(),
  }
  memoryRaw = JSON.stringify(entry)
  try {
    window.localStorage.setItem(KEY, memoryRaw)
  } catch {
    // private mode / storage disabled -> memoryRaw still carries the session
  }
  emitChange()
}

/** Drop the entry (reconcile, Sonar sign-out). */
export function clearPendingBid(): void {
  memoryRaw = null
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // storage disabled -> memory already cleared
  }
  emitChange()
}

function getRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY) ?? memoryRaw
  } catch {
    return memoryRaw
  }
}

// Pure parse: expired, foreign-wallet, or malformed reads as null, with NO purge side effect
// (cleanup happens via clearPendingBid or the next write). A foreign-wallet entry is preserved:
// the original wallet may reconnect within the TTL.
function parsePendingBid(
  raw: string | null,
  address: string | undefined,
  now: number,
): PendingBid | null {
  if (raw == null) return null
  let entry: PendingBid
  try {
    entry = JSON.parse(raw)
  } catch {
    return null
  }
  if (
    typeof entry?.committedUsd !== "number" ||
    typeof entry.priceUsd !== "number" ||
    typeof entry.lockup !== "boolean" ||
    typeof entry.address !== "string" ||
    typeof entry.timestamp !== "number"
  ) {
    return null
  }
  if (now - entry.timestamp > PENDING_BID_TTL_MS) return null
  if (!address || entry.address !== address.toLowerCase()) return null
  return entry
}

/** The connected wallet's pending bid, or null when absent/expired/foreign. Non-hook read. */
export function readPendingBid(
  address: string | undefined,
  now: number = Date.now(),
): PendingBid | null {
  return parsePendingBid(getRaw(), address, now)
}

// Float guard for the price comparison: our tick prices and Sonar's PriceMicroUSD/1e6 are both
// exact micro-USD values, so any real mismatch is orders of magnitude above this.
const PRICE_EPSILON = 1e-6

/**
 * The single pending derivation. sonar: undefined = read not settled, null = no bid reported.
 * While the entry exists its values ARE the position (the receipt is newer than any Sonar answer
 * until reconciled - a same-amount price raise is invisible to amount comparisons). The chip
 * delta requires a settled read: an unresolved baseline would overcount a raise as a new bid.
 */
export function derivePendingView(
  pending: PendingBid | null,
  sonar: MyBid | undefined,
): PendingView {
  if (!pending) return { myBid: sonar ?? null, pendingIndexing: false, delta: null }
  const asBid = {
    priceUsd: pending.priceUsd,
    committedUsd: pending.committedUsd,
    lockup: pending.lockup,
  }
  if (sonar === undefined) return { myBid: asBid, pendingIndexing: true, delta: null }
  const unreported = pending.committedUsd - (sonar?.committedUsd ?? 0)
  return {
    myBid: asBid,
    pendingIndexing: true,
    delta: unreported > 0 ? { amountUsd: unreported, newBidder: sonar == null } : null,
  }
}

/** Purge the entry once Sonar reports the bid - amount AND price (a same-amount price raise is
 *  only reconciled when the new price shows up). TTL bounds the case where Sonar never matches. */
export function reconcilePendingBid(sonar: MyBid, address: string | undefined): void {
  const pending = readPendingBid(address)
  if (
    pending &&
    sonar != null &&
    sonar.committedUsd >= pending.committedUsd &&
    Math.abs(sonar.priceUsd - pending.priceUsd) <= PRICE_EPSILON
  ) {
    clearPendingBid()
  }
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onStoreChange)
  window.addEventListener("storage", onStoreChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange)
    window.removeEventListener("storage", onStoreChange)
  }
}

/** SSR-safe + reactive pending bid for the connected wallet. Returns a referentially stable
 *  object (memoized) so it can sit in dependency arrays. Self-expires: a timer re-evaluates the
 *  TTL at its deadline, so a mounted tab drops the overlay (and its polling) without any event. */
export function usePendingBid(address: string | undefined): PendingBid | null {
  const raw = useSyncExternalStore(subscribe, getRaw, () => null)
  const [epoch, bumpEpoch] = useReducer((n: number) => n + 1, 0)
  const pending = useMemo(() => {
    // epoch is the TTL re-check trigger: the timer below bumps it at the expiry deadline.
    void epoch
    return parsePendingBid(raw, address, Date.now())
  }, [raw, address, epoch])
  useEffect(() => {
    if (!pending) return
    const msLeft = pending.timestamp + PENDING_BID_TTL_MS - Date.now()
    const t = setTimeout(bumpEpoch, Math.max(msLeft, 0) + 50)
    return () => clearTimeout(t)
  }, [pending])
  return pending
}
