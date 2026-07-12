"use client"

import dynamic from "next/dynamic"
import { useFunnelCapable } from "../../lib/device/funnel-gate"
import { PausedBar } from "./BidBarShell"
import { useSale } from "./SaleProvider"

const BidPanelDesktop = dynamic(() => import("./BidPanelDesktop").then((m) => m.BidPanelDesktop), {
  ssr: false,
  loading: () => null,
})
const BidPanelAwareness = dynamic(
  () => import("./BidPanelAwareness").then((m) => m.BidPanelAwareness),
  { ssr: false, loading: () => null },
)
const PreSaleBarMobile = dynamic(() => import("./PreSaleBar").then((m) => m.PreSaleBarMobile), {
  ssr: false,
  loading: () => null,
})

export function BidPanel() {
  const funnelCapable = useFunnelCapable()
  const { phase, commitment } = useSale()
  if (funnelCapable === undefined) return null
  if (commitment.paused) return <PausedBar />
  if (funnelCapable) return <BidPanelDesktop />
  // Mobile/touch: registration + KYC are unlocked during pre-sale; bidding stays desktop-only,
  // so the live/ended phases keep the awareness bar.
  return phase === "pre-sale" ? <PreSaleBarMobile /> : <BidPanelAwareness />
}
