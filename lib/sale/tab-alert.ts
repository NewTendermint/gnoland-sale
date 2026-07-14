import type { SaleTranslator } from "./labels"
import type { JourneyState, SalePhase } from "./types"

// Background tab re-engagement state. Drives document.title + favicon badge (app/(layout)/TabAlert.tsx).
export type TabAlertState = "outbid" | "closing-soon" | null

export const CLOSING_SOON_WINDOW_MS = 2 * 60 * 60 * 1000

// User-facing tab titles. "|" matches the base title convention (app/layout.tsx).
export function tabAlertTitle(t: SaleTranslator): Record<NonNullable<TabAlertState>, string> {
  return {
    outbid: t("tabOutbid"),
    "closing-soon": t("tabClosingSoon"),
  }
}

// Pre-baked badged favicons (gno.land mark + a status dot), in public/. The colours baked into
// the SVGs mirror --danger / --amber (styles/tokens.css); keep in sync.
export const TAB_ALERT_ICON: Record<NonNullable<TabAlertState>, string> = {
  outbid: "/favicon-outbid.svg",
  "closing-soon": "/favicon-closing.svg",
}

export function resolveTabAlertState(input: {
  journey: JourneyState
  phase: SalePhase
  saleClosesMs: number
  nowMs: number
}): TabAlertState {
  // Live-only: after close there is nothing to raise, the settlement UI takes over.
  if (input.phase === "live" && input.journey === "has-bid-outbid") return "outbid"
  const msLeft = input.saleClosesMs - input.nowMs
  if (input.phase === "live" && msLeft > 0 && msLeft <= CLOSING_SOON_WINDOW_MS) {
    return "closing-soon"
  }
  return null
}
