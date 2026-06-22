"use client"

import { useEffect, useState } from "react"

// Non-PII "seen before" flag (no status, no identity). Footgun: never treat it as a status
// source - it only swaps the cold "Register" copy for "reconnect"; the KYC state is fetched live.
const KEY = "gnot:sonar-seen"

/** Record that this browser had a Sonar entity. Safe no-op if storage is blocked. */
export function markSonarSeen(): void {
  try {
    window.localStorage.setItem(KEY, "1")
  } catch {
    // private mode / storage disabled -> degrade silently to "new visitor"
  }
}

/** SSR-safe: false until an effect resolves, so it never causes a hydration mismatch. */
export function useSonarSeen(): boolean {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    try {
      setSeen(window.localStorage.getItem(KEY) === "1")
    } catch {
      setSeen(false)
    }
  }, [])
  return seen
}
