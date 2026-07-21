"use client"

// Keep FUNNEL_MEDIA_QUERY in sync with the `funnel` @custom-variant in app/globals.css
// (asserted by tests/unit/device/funnel-gate.test.ts).
import { LG_MEDIA_QUERY } from "./breakpoints"
import { useMediaQuery } from "./use-media-query"

// Desktop/tablet vs phone: qualify on width OR a fine pointer OR hover. any-* catches a laptop's
// mouse/trackpad even alongside a touchscreen (where the browser can report the device as coarse).
// Only a phone - narrow, no fine pointer, no hover - fails all three and gets the awareness UI.
export const FUNNEL_MEDIA_QUERY = `${LG_MEDIA_QUERY} or (any-pointer: fine) or (any-hover: hover)`

export function useFunnelCapable(): boolean | undefined {
  return useMediaQuery(FUNNEL_MEDIA_QUERY, undefined)
}
