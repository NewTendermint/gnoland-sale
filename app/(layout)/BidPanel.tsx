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

export function BidPanel() {
  const funnelCapable = useFunnelCapable()
  const { commitment } = useSale()
  if (funnelCapable === undefined) return null
  if (commitment.paused) return <PausedBar />
  return funnelCapable ? <BidPanelDesktop /> : <BidPanelAwareness />
}
