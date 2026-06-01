"use client"

/**
 * Live countdown to a target ISO timestamp. Mount-safe: renders a placeholder
 * until the first client tick so server and client markup match (no hydration
 * mismatch). Granularity coarsens with distance: "Dd Hh" while days remain (no
 * minutes), "Hh Mm" under a day, "Mm Ss" under an hour. Seconds appear only in the
 * final hour, where the tick conveys urgency. The interval adapts to match: 1s in
 * the final hour, 60s before, so far out it stays calm without needless re-renders.
 */
import { useEffect, useState } from "react"

function format(ms: number): string {
  if (ms <= 0) return "0m"
  const days = Math.floor(ms / 86_400_000)
  const hours = Math.floor((ms % 86_400_000) / 3_600_000)
  const mins = Math.floor((ms % 3_600_000) / 60_000)
  const secs = Math.floor((ms % 60_000) / 1000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m ${secs}s`
}

export function Countdown({
  targetIso,
  placeholder = "--",
}: { targetIso: string; placeholder?: string }) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const target = new Date(targetIso).getTime()
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      const ms = Math.max(0, target - Date.now())
      setRemaining(ms)
      // 1s only in the final hour (seconds shown); coarser before to avoid churn.
      id = setTimeout(tick, ms < 3_600_000 ? 1000 : 60_000)
    }
    tick()
    return () => clearTimeout(id)
  }, [targetIso])

  return (
    <span className="tabular-nums">{remaining === null ? placeholder : format(remaining)}</span>
  )
}
