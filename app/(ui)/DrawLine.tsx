"use client"

import type { Ref } from "react"
import { useDrawLine } from "../../lib/motion/use-motion"

export function DrawLine({
  className = "",
  colorClass = "bg-border",
  as = "div",
  immediate = false,
  delayMs = 0,
  index,
}: {
  className?: string
  colorClass?: string
  as?: "div" | "li"
  immediate?: boolean
  delayMs?: number
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
