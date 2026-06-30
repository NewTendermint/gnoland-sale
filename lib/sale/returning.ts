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
