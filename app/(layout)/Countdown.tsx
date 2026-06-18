"use client"

import { useEffect, useState } from "react"
import { fmtCountdown } from "../../lib/sale/format"

export function Countdown({
  targetIso,
  placeholder = "--",
  seconds = true,
}: { targetIso: string; placeholder?: string; seconds?: boolean }) {
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

  return (
    <span className="tabular-nums">
      {remaining === null ? placeholder : fmtCountdown(remaining, seconds)}
    </span>
  )
}
