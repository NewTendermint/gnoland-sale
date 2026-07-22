"use client"

import {
  RevealGroupContext,
  useRevealGroup,
  useRevealGroupController,
} from "@/lib/motion/reveal-group"
import type { ReactNode, Ref } from "react"

export function RevealGroup({
  as = "div",
  className = "",
  staggerMs = 120,
  baseDelayMs = 0,
  fromBottomPct = 20,
  inline = false,
  children,
}: {
  as?: "div" | "section" | "dl" | "ul" | "ol" | "li"
  className?: string
  staggerMs?: number
  baseDelayMs?: number
  fromBottomPct?: number
  inline?: boolean
  children: ReactNode
}) {
  const parent = useRevealGroup()
  const { ref, api } = useRevealGroupController({ staggerMs, baseDelayMs, fromBottomPct, inline })
  const Tag = as as "div"
  if (parent) {
    return inline ? <>{children}</> : <Tag className={className}>{children}</Tag>
  }
  if (inline) {
    return <RevealGroupContext.Provider value={api}>{children}</RevealGroupContext.Provider>
  }
  return (
    <RevealGroupContext.Provider value={api}>
      <Tag ref={ref as Ref<HTMLDivElement>} className={className}>
        {children}
      </Tag>
    </RevealGroupContext.Provider>
  )
}

// Cuts the enclosing RevealGroup context so the subtree's primitives get their own trigger.
export function RevealBoundary({ children }: { children: ReactNode }) {
  return <RevealGroupContext.Provider value={null}>{children}</RevealGroupContext.Provider>
}
