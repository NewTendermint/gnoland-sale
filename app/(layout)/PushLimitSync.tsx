"use client"

import { refreshPushLimit } from "@/lib/push/subscribe"
import { useEffect } from "react"
import { useSale } from "./SaleProvider"

// Headless: when the bidder raises, re-post the new limit so a live subscription's stored limit
// stays accurate for the outbid cron. No-op for non-subscribers. Mounted home-only in SaleProvider.
export function PushLimitSync() {
  const { myBid } = useSale()
  const price = myBid?.priceUsd ?? null
  useEffect(() => {
    if (price != null) refreshPushLimit(price)
  }, [price])
  return null
}
