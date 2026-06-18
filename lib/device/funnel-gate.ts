"use client"

// Keep FUNNEL_MEDIA_QUERY in sync with the `funnel` @custom-variant in app/globals.css
// (asserted by tests/unit/device/funnel-gate.test.ts).
import { LG_MEDIA_QUERY } from "./breakpoints"
import { useMediaQuery } from "./use-media-query"

export const FUNNEL_MEDIA_QUERY = `(hover: hover) and (pointer: fine) and ${LG_MEDIA_QUERY}`

export function useFunnelCapable(): boolean | undefined {
  return useMediaQuery(FUNNEL_MEDIA_QUERY, undefined)
}
