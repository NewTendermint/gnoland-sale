"use client"

import { refreshPushLimit } from "@/lib/push/subscribe"
import { useEffect } from "react"
import { useSale } from "./SaleProvider"

// Headless: keeps push subscription bid-limit in sync; no-op for non-subscribers.
export function PushLimitSync() {
  const { myBid } = useSale()
  const price = myBid?.priceUsd ?? null
  useEffect(() => {
    if (price != null) refreshPushLimit(price)
  }, [price])
  return null
}
