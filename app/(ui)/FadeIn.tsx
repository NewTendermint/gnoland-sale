"use client"

import type { ReactNode, Ref } from "react"
import { useFade } from "../../lib/motion/use-motion"

/**
 * Wraps content so it fades + rises in gently when scrolled into view (no
 * line-by-line split). For content that should appear calmly - team members,
 * the TokenDetails blocks. Reduced-motion / touch: shown as-is, no animation.
 */
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
  /** Fade on mount instead of on scroll (for always-visible elements). */
  immediate?: boolean
  delayMs?: number
  /** Cascade slot when inside a RevealGroup (omit to rank by DOM order). */
  index?: number
  /** ARIA role passthrough (e.g. role="img" for a chart bar). */
  role?: string
  "aria-label"?: string
  /** Optional - a FadeIn can wrap an empty box (e.g. a logo placeholder). */
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
