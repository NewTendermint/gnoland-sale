"use client"

import { useReveal } from "@/lib/motion/use-motion"
import type { ReactNode, Ref } from "react"

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
  index?: number
  children: ReactNode
}) {
  const ref = useReveal<HTMLElement>({ immediate, type, delayMs, index })
  const Tag = as as "div"
  return (
    <Tag ref={ref as Ref<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  )
}
