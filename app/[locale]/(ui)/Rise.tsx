"use client"

import { useRise } from "@/lib/motion/use-motion"
import type { ReactNode } from "react"

export function Rise({
  className = "",
  immediate = false,
  delayMs = 0,
  index,
  children,
}: {
  className?: string
  immediate?: boolean
  delayMs?: number
  index?: number
  children: ReactNode
}) {
  const ref = useRise<HTMLDivElement>({ immediate, delayMs, index })
  return (
    <div ref={ref} className="overflow-clip">
      <div className={className}>{children}</div>
    </div>
  )
}
