"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Reactive matchMedia hook: returns whether `query` currently matches and re-renders
 * on every change. The single source for media-query gating across the app (the
 * funnel capability gate, the desktop-only parallax, ...). `serverValue` is what it
 * reports during SSR and the first pre-hydration client frame - `false` by default;
 * pass `undefined` when the caller must render nothing until the real value is known
 * (so it never flashes the wrong branch, e.g. the bid-bar variant).
 */
export function useMediaQuery(query: string, serverValue: boolean | undefined = false) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}
