"use client"

import { fmtCountdown } from "@/lib/sale/format"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

export function Countdown({
  targetIso,
  placeholder = "--",
  seconds = true,
  label,
}: { targetIso: string; placeholder?: string; seconds?: boolean; label?: string }) {
  const t = useTranslations("Sale")
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const target = new Date(targetIso).getTime()
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      setRemaining(Math.max(0, target - Date.now()))
      id = setTimeout(tick, 1000)
    }
    tick()
    return () => clearTimeout(id)
  }, [targetIso])

  // role="timer" keeps aria-live off: per-second announcements are an anti-pattern, the label
  // gives the placeholder and the ticking value an accessible name instead.
  return (
    <span className="tabular-nums" role="timer" aria-label={label}>
      {remaining === null ? placeholder : fmtCountdown(remaining, seconds, t("countdownDay"))}
    </span>
  )
}
