"use client"

/**
 * Sticky bid bar dispatcher. One policy (lib/device/funnel-gate.ts) decides
 * which bar a visitor gets: funnel-capable contexts (fine pointer + hover +
 * >= lg) mount the full funnel bar (BidPanelDesktop); touch devices and narrow
 * windows mount the read-only awareness bar (BidPanelAwareness) - no wallet, no
 * Sonar, no expansion (docs/specs/2026-06-13-mobile-awareness-only-design.md).
 * The first client frame (capability unknown) renders nothing; the bar's 1100ms
 * `.bar-enter` entrance fade makes that frame invisible. The paused kill-switch
 * is phase- and device-agnostic, so it is resolved here, above both variants.
 */
import { useFunnelCapable } from "../../lib/device/funnel-gate"
import { PausedBar } from "./BidBarShell"
import { BidPanelAwareness } from "./BidPanelAwareness"
import { BidPanelDesktop } from "./BidPanelDesktop"
import { useSale } from "./SaleProvider"

export function BidPanel() {
  const funnelCapable = useFunnelCapable()
  const { commitment } = useSale()
  if (funnelCapable === undefined) return null
  if (commitment.paused) return <PausedBar />
  return funnelCapable ? <BidPanelDesktop /> : <BidPanelAwareness />
}
