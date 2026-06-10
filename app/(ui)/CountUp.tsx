"use client"

import type { Ref } from "react"
import { useCountUp } from "../../lib/motion/use-motion"

/**
 * A key figure that counts up from 0 to its value when scrolled into view
 * (cubic ease-out, like newtendermint.org). `value` is the final string
 * ("150+", "1,337"...) - it is also what renders server-side, so reduced-motion
 * / touch / no-JS show the final number with no animation.
 */
export function CountUp({
  value,
  className = "",
  as = "span",
  immediate = false,
  index,
}: {
  value: string
  className?: string
  as?: "span" | "dd" | "p" | "div"
  immediate?: boolean
  /** Cascade slot when inside a RevealGroup (e.g. a stats row). */
  index?: number
}) {
  const ref = useCountUp<HTMLElement>(value, { immediate, index })
  const Tag = as as "span"
  return (
    <Tag ref={ref as Ref<HTMLSpanElement>} className={className}>
      {value}
    </Tag>
  )
}
