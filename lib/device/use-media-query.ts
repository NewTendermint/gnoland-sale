"use client"

import { useCallback, useSyncExternalStore } from "react"

/** Reactive matchMedia hook; `serverValue` (default false) is reported during SSR / first frame. */
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
