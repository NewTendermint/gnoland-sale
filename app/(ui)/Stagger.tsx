"use client"

import type { ReactNode, Ref } from "react"
import { useStagger } from "../../lib/motion/use-motion"

/**
 * Wraps a grid / list so its direct children fade + rise in one after another
 * when it scrolls into view (IntersectionObserver + CSS, no GSAP). Use on a
 * container whose children are the items to stagger (cards, milestones...).
 * Reduced-motion / touch: shown as-is, no animation.
 */
export function Stagger({
  as = "ul",
  className = "",
  delayMs = 0,
  immediate = false,
  children,
}: {
  as?: "ul" | "ol" | "div" | "dl"
  className?: string
  delayMs?: number
  /** Cascade on mount instead of on scroll (for always-visible rows). */
  immediate?: boolean
  children: ReactNode
}) {
  const ref = useStagger<HTMLElement>({ delayMs, immediate })
  // Render the requested container tag, typed as one concrete element so the ref
  // prop has a single type; at runtime useStagger only needs a plain HTMLElement.
  const Tag = as as "div"
  return (
    <Tag ref={ref as Ref<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  )
}
