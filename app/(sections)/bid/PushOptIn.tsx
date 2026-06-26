"use client"

import { type PushOptInResult, enablePushAlerts, hasPushSubscription } from "@/lib/push/subscribe"
import { useEffect, useState } from "react"
import { Cta } from "../../(ui)/Cta"
import { Icon } from "../../(ui)/Icon"

// Opt-in for outbid push alerts, shown inline next to the bid receipt (the "right moment"). Desktop
// push only; renders nothing where unsupported. Stores only the bid limit (no PII).
export function PushOptIn({ bidLimitUsd }: { bidLimitUsd: number }) {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<"idle" | "working" | PushOptInResult>("idle")

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
    // Already subscribed (e.g. after a raise): show the confirmation, not the offer.
    hasPushSubscription().then((subbed) => {
      if (subbed) setStatus("granted")
    })
  }, [])

  if (!supported || status === "unsupported") return null

  if (status === "granted") {
    return (
      <div className="flex flex-col gap-1 sm:items-end">
        <p className="flex items-center gap-2 text-xs text-mint">
          <Icon name="shield-check" draw={false} className="h-4 w-4 shrink-0" />
          Alerts on. We'll notify you if you're outbid.
        </p>
        <p className="text-[11px] text-muted">
          Not receiving them? Turn on notifications for your browser in your system settings.
        </p>
      </div>
    )
  }

  // Blocked at the browser level: the offer can't work (a denied permission can't be re-prompted),
  // so guide the user to re-enable instead of hiding silently.
  if (status === "denied") {
    return (
      <p className="text-xs text-muted sm:text-right">
        Notifications are blocked. Enable them for your browser in your system settings to get
        outbid alerts.
      </p>
    )
  }

  const note =
    status === "error"
      ? "Could not enable alerts. Try again."
      : "Get notified if you're outbid, even after you close this tab."

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-xs text-muted">{note}</p>
      <Cta
        variant="ghost-contrast"
        size="sm"
        disabled={status === "working"}
        onClick={async () => {
          setStatus("working")
          setStatus(await enablePushAlerts(bidLimitUsd))
        }}
      >
        {status === "working" ? "Enabling" : "Enable alerts"}
      </Cta>
    </div>
  )
}
