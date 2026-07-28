"use client"

import { useSyncExternalStore } from "react"

// Non-PII "seen before" flag (no status, no identity). Footgun: never treat it as a status
// source - it only swaps the cold "Register" copy for "reconnect"; the KYC state is fetched live.
const KEY = "gnot:sonar-seen"
// Same-tab notify: the `storage` event only fires in OTHER tabs, so mark/clear emit this too.
const CHANGE_EVENT = "gnot:sonar-seen-change"

function emitChange(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Record that this browser had a Sonar entity. Safe no-op if storage is blocked. */
export function markSonarSeen(): void {
  try {
    window.localStorage.setItem(KEY, "1")
    emitChange()
  } catch {
    // private mode / storage disabled -> degrade silently to "new visitor"
  }
}

/** Forget the flag (e.g. on sign-out) so the user returns to the first-time "Verify" state. */
export function clearSonarSeen(): void {
  try {
    window.localStorage.removeItem(KEY)
    emitChange()
  } catch {
    // storage disabled -> nothing to clear
  }
}

// Non-PII "has a bid" flag: bids are irrevocable while the sale runs, so a my-position null on a
// browser that has seen one is suspect and gets re-read before being trusted (readMyPosition in
// lib/sale/confirmed-read.ts).
const BID_KEY = "gnot:bid-seen"

/** Record that this browser has read a live bid. Safe no-op if storage is blocked. */
export function markBidSeen(): void {
  try {
    window.localStorage.setItem(BID_KEY, "1")
  } catch {
    // private mode / storage disabled -> degrade to "unknown bidder"
  }
}

/** Whether this browser has ever read a live bid. */
export function hasBidSeen(): boolean {
  try {
    return window.localStorage.getItem(BID_KEY) === "1"
  } catch {
    return false
  }
}

/** Forget the flag (sign-out): the next session may be another account, and a stale flag makes
 *  every legitimate null position sit through the confirm re-reads before rendering. */
export function clearBidSeen(): void {
  try {
    window.localStorage.removeItem(BID_KEY)
  } catch {
    // storage disabled -> nothing to clear
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

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

/** SSR-safe + reactive: re-reads on mark/clear (and cross-tab) so sign-out updates the UI live. */
export function useSonarSeen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Non-hook read of the sonar-seen flag, for non-React callers (confirmed reads). */
export function hasSonarSeen(): boolean {
  return getSnapshot()
}
