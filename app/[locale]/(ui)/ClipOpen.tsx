"use client"

import { useClipOpen } from "@/lib/motion/use-motion"
import type { ReactNode, Ref } from "react"

export function ClipOpen({
  className = "",
  lead = false,
  index,
  durationMs,
  fromBottomPct,
  children,
}: {
  className?: string
  lead?: boolean
  index?: number
  durationMs?: number
  fromBottomPct?: number
  children: ReactNode
}) {
  const ref = useClipOpen<HTMLDivElement>({ lead, index, durationMs, fromBottomPct })
  return (
    <div ref={ref as Ref<HTMLDivElement>} className={className}>
      {children}
    </div>
  )
}
