"use client"

import { useEffect, useRef } from "react"

/** Move focus to the currently-rendered view container whenever `state` changes: when a click
 *  unmounts its own button (or disables it), focus falls back to <body> and the replacing view is
 *  never announced to screen readers. Skips the initial render so gallery/preview mounts never
 *  steal focus. Attach the returned ref together with tabIndex={-1}. */
export function useViewFocus<T extends HTMLElement>(state: string) {
  const ref = useRef<T>(null)
  const prev = useRef(state)
  useEffect(() => {
    if (prev.current === state) return
    prev.current = state
    ref.current?.focus({ preventScroll: true })
  }, [state])
  return ref
}
