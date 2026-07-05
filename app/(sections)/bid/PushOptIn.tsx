"use client"

import { type PushOptInResult, enablePushAlerts, hasPushSubscription } from "@/lib/push/subscribe"
import { useEffect, useState } from "react"

type PushOptInStatus = "idle" | "working" | PushOptInResult

// Push opt-in state machine, presentation-free: the post-bid row (BidFlow) renders the compact
// CTA / detail views itself. Probes existing permission + subscription at mount; `enable` runs
// the SW + permission + subscribe + POST chain. Desktop only; unsupported -> supported: false.
export function usePushAlerts(bidLimitUsd: number) {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<PushOptInStatus>("idle")

  useEffect(() => {
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window &&
      Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    setSupported(ok)
    if (!ok) return
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    hasPushSubscription().then((subbed) => {
      if (subbed) setStatus("granted")
    })
  }, [])

  const enable = async () => {
    setStatus("working")
    setStatus(await enablePushAlerts(bidLimitUsd))
  }

  return { supported, status, enable }
}
