"use client"

import type { ReactNode, Ref } from "react"
import {
  RevealGroupContext,
  useRevealGroup,
  useRevealGroupController,
} from "../../lib/motion/reveal-group"

/**
 * Wraps a stack (or row) of reveal primitives so they share ONE scroll trigger and
 * cascade in visual order, finish-ordered (nothing finishes before the element above
 * it). See lib/motion/reveal-group.ts. Nested groups are transparent (their members
 * join the outer cascade), so a SectionHeading (itself a group) can sit inside a
 * wider RevealGroup. `inline` renders no wrapper element (a Fragment) and triggers
 * off the topmost member - use it to group siblings that are themselves grid items,
 * so the grid layout is untouched. Reduced-motion / touch: members render as-is.
 */
export function RevealGroup({
  as = "div",
  className = "",
  staggerMs = 120,
  baseDelayMs = 0,
  fromBottomPct = 30,
  inline = false,
  children,
}: {
  as?: "div" | "section" | "dl" | "ul" | "ol" | "li"
  className?: string
  /** Minimum delay between consecutive members (ms). */
  staggerMs?: number
  /** Delay before the first member (ms). */
  baseDelayMs?: number
  /** Trigger when the group's top reaches this % from the viewport bottom. */
  fromBottomPct?: number
  /** Render no wrapper box (a Fragment) and trigger off the topmost member - for
   * grouping siblings that are direct grid items, leaving the layout untouched. */
  inline?: boolean
  children: ReactNode
}) {
  const parent = useRevealGroup()
  const { ref, api } = useRevealGroupController({ staggerMs, baseDelayMs, fromBottomPct, inline })
  const Tag = as as "div"
  // Nested inside another group: stay transparent so our members join the outer
  // cascade (inline adds no box at all; boxed keeps its layout element).
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

/**
 * Cuts the enclosing RevealGroup context for its subtree (renders no DOM): the
 * reveal primitives inside get their OWN scroll trigger instead of joining the
 * surrounding coordinated group. Use it to keep part of a region (e.g. the prose
 * below a coordinated title + images) on its own scroll-in, while the rest of the
 * region stays in the shared timeline.
 */
export function RevealBoundary({ children }: { children: ReactNode }) {
  return <RevealGroupContext.Provider value={null}>{children}</RevealGroupContext.Provider>
}
