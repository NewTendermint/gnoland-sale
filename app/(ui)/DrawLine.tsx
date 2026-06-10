"use client"

import type { Ref } from "react"
import { useDrawLine } from "../../lib/motion/use-motion"

/**
 * A horizontal hairline that draws itself left-to-right when it rises to ~25%
 * from the BOTTOM of the viewport (one-shot appear). The outer element is the
 * full-width wrapper the observer watches; its single child is the line that
 * actually draws. Reduced-motion / touch: shown full, no animation.
 */
export function DrawLine({
  className = "",
  colorClass = "bg-border",
  as = "div",
  immediate = false,
  delayMs = 0,
  index,
}: {
  className?: string
  /** Tailwind background for the line (e.g. "bg-on-contrast/15" on dark tiles). */
  colorClass?: string
  /** Wrapper tag. Use "li" when placed directly inside a <ul>/<ol> (valid HTML). */
  as?: "div" | "li"
  /** Draw once on mount instead of on scroll (for always-visible lines). */
  immediate?: boolean
  delayMs?: number
  /** Cascade slot when inside a RevealGroup (e.g. a stats row). */
  index?: number
}) {
  const ref = useDrawLine<HTMLElement>({ immediate, delayMs, index })
  const line = <div className={`h-px w-full ${colorClass}`} />
  const wrapClass = `w-full ${className}`
  return as === "li" ? (
    <li ref={ref as Ref<HTMLLIElement>} aria-hidden="true" className={wrapClass}>
      {line}
    </li>
  ) : (
    <div ref={ref as Ref<HTMLDivElement>} aria-hidden="true" className={wrapClass}>
      {line}
    </div>
  )
}
