"use client"

import type { ReactNode, Ref } from "react"
import { useReveal } from "../../lib/motion/use-motion"

/**
 * Wraps a block of text so it reveals line-by-line (Cuberto-style mask slide-up)
 * on scroll, or on mount with `immediate` (above-the-fold text like the hero
 * title). Renders `as` (a heading or paragraph) and applies the shared SplitText
 * reveal. Reduced-motion / touch: text shown as-is, no split, no animation.
 */
export function Reveal({
  as = "div",
  immediate = false,
  type = "lines",
  className = "",
  delayMs = 0,
  index,
  children,
}: {
  as?: "h1" | "h2" | "h3" | "p" | "div" | "li" | "ul"
  immediate?: boolean
  type?: "lines" | "words"
  className?: string
  delayMs?: number
  /** Cascade slot when inside a RevealGroup (omit to rank by DOM order). */
  index?: number
  children: ReactNode
}) {
  const ref = useReveal<HTMLElement>({ immediate, type, delayMs, index })
  // Render the requested tag, but type it as one concrete element so the ref prop
  // has a single type; at runtime useReveal only needs a plain HTMLElement.
  const Tag = as as "div"
  return (
    <Tag ref={ref as Ref<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  )
}
