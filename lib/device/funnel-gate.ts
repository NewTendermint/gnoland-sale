"use client"

/**
 * Funnel capability gate: the sale funnel (Sonar registration, wallet connect,
 * bid, claim, my-position) only renders on desktop-grade contexts - fine pointer
 * + hover + viewport at least Tailwind's lg. Everything else (touch devices at
 * any width, narrow windows) gets the awareness-only UI: notify email,
 * add-to-calendar, read-only metrics and a "continue on desktop" notice.
 * Decision + rationale: docs/specs/2026-06-13-mobile-awareness-only-design.md.
 *
 * This is a UX policy, not a security boundary - every real check (session,
 * Sonar calls, permit issuance, contract) stays server/contract-side.
 *
 * One query, two consumers: this hook (behavioral gating - which bar variant to
 * mount, whether Sonar queries run) and the `funnel` @custom-variant in
 * app/globals.css (presentational gating, SSR-correct dual render). CSS cannot
 * import this constant, so a unit test (tests/unit/device/funnel-gate.test.ts)
 * asserts the two stay in sync.
 */
import { LG_MEDIA_QUERY } from "./breakpoints"
import { useMediaQuery } from "./use-media-query"

/** Funnel-capable = desktop-grade input (fine pointer + hover) at lg or wider. */
export const FUNNEL_MEDIA_QUERY = `(hover: hover) and (pointer: fine) and ${LG_MEDIA_QUERY}`

/**
 * True on funnel-capable contexts, false on awareness-only ones, undefined until
 * the first client render resolves (SSR + hydration) - `undefined` lets consumers
 * render nothing for one frame instead of flashing the wrong variant (the sticky
 * bar's 1100ms entrance fade masks that frame). Reactive via the shared
 * useMediaQuery: resizing across lg or an input-capability change re-renders live.
 */
export function useFunnelCapable(): boolean | undefined {
  return useMediaQuery(FUNNEL_MEDIA_QUERY, undefined)
}
