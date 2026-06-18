"use client"

import type { ReactNode, Ref } from "react"
import { useClipOpen } from "../../lib/motion/use-motion"

export function ClipOpen({
  className = "",
  lead = false,
  index,
  durationMs,
  children,
}: {
  className?: string
  lead?: boolean
  index?: number
  durationMs?: number
  children: ReactNode
}) {
  const ref = useClipOpen<HTMLDivElement>({ lead, index, durationMs })
  return (
    <div ref={ref as Ref<HTMLDivElement>} className={className}>
      {children}
    </div>
  )
}
