"use client"

import type { Ref } from "react"
import { useCountUp } from "../../lib/motion/use-motion"

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
