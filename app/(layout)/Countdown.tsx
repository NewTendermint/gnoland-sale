"use client"

import { useEffect, useState } from "react"
import { fmtCountdown } from "../../lib/sale/format"

export function Countdown({
  targetIso,
  placeholder = "--",
  seconds = true,
  label,
}: { targetIso: string; placeholder?: string; seconds?: boolean; label?: string }) {
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
      {remaining === null ? placeholder : fmtCountdown(remaining, seconds)}
    </span>
  )
}
