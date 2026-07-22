"use client"

import { useStagger } from "@/lib/motion/use-motion"
import type { ReactNode, Ref } from "react"

export function Stagger({
  as = "ul",
  className = "",
  delayMs = 0,
  immediate = false,
  active,
  staggerMs,
  durationMs,
  yPx,
  children,
}: {
  as?: "ul" | "ol" | "div" | "dl"
  className?: string
  delayMs?: number
  immediate?: boolean
  /** Controlled open/close flag; drives the cascade off an open state (plays on touch). */
  active?: boolean
  staggerMs?: number
  durationMs?: number
  yPx?: number
  children: ReactNode
}) {
  const ref = useStagger<HTMLElement>({ delayMs, immediate, active, staggerMs, durationMs, yPx })
  const Tag = as as "div"
  return (
    <Tag ref={ref as Ref<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  )
}
