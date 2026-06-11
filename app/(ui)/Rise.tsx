"use client"

import type { ReactNode } from "react"
import { useRise } from "../../lib/motion/use-motion"

/**
 * Masked slide-up for a whole element (a table row, a key/value line) - the tile
 * text reveal's look without running SplitText per row. Renders a full-box wrapper
 * (the mask) that clips its overflow; its single inner div (carrying `className`) is
 * parked below the mask and slides up into view on scroll-in. Inside a RevealGroup it
 * joins the shared cascade. Reduced-motion / touch: shown in place, no animation.
 */
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
  /** Cascade slot when inside a RevealGroup (omit to rank by DOM order). */
  index?: number
  children: ReactNode
}) {
  const ref = useRise<HTMLDivElement>({ immediate, delayMs, index })
  // The wrapper is the mask (full box, overflow clipped); its single child slides.
  return (
    <div ref={ref} className="overflow-clip">
      <div className={className}>{children}</div>
    </div>
  )
}
