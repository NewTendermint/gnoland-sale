"use client"

import type { ReactNode, Ref } from "react"
import { useFade } from "../../lib/motion/use-motion"

export function FadeIn({
  as = "div",
  className = "",
  immediate = false,
  delayMs = 0,
  index,
  role,
  "aria-label": ariaLabel,
  children,
}: {
  as?: "div" | "li" | "h3" | "p" | "span" | "dt"
  className?: string
  immediate?: boolean
  delayMs?: number
  index?: number
  role?: string
  "aria-label"?: string
  children?: ReactNode
}) {
  const ref = useFade<HTMLElement>({ immediate, delayMs, index })
  const Tag = as as "div"
  return (
    <Tag ref={ref as Ref<HTMLDivElement>} role={role} aria-label={ariaLabel} className={className}>
      {children}
    </Tag>
  )
}
