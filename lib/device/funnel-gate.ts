"use client"

// Keep FUNNEL_MEDIA_QUERY in sync with the `funnel` @custom-variant in app/globals.css
// (asserted by tests/unit/device/funnel-gate.test.ts).
import { LG_MEDIA_QUERY } from "./breakpoints"
import { useMediaQuery } from "./use-media-query"

// any-* (not primary-input hover/pointer): a touchscreen laptop reports its touch digitizer as
// the primary input and would be false-negatived out of the funnel; any capable input qualifies.
export const FUNNEL_MEDIA_QUERY = `(any-hover: hover) and (any-pointer: fine) and ${LG_MEDIA_QUERY}`

export function useFunnelCapable(): boolean | undefined {
  return useMediaQuery(FUNNEL_MEDIA_QUERY, undefined)
}
