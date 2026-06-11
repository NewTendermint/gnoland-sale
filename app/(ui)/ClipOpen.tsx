"use client"

import type { ReactNode, Ref } from "react"
import { useClipOpen } from "../../lib/motion/use-motion"

/**
 * Wraps an image / scene box (or a content tile) so it opens like a window: the
 * clip-path grows the whole box from one edge when scrolled into view, revealing
 * its contents with a clean wipe. Reduced-motion / touch: shown open. The wrapped
 * element carries the box's background + rounded corners.
 *
 * `lead`: this box leads a RevealGroup (a tile timeline) - it opens first and the
 * group's content reveal starts partway through the growth. See useClipOpen / RevealGroup.
 */
export function ClipOpen({
  className = "",
  lead = false,
  index,
  durationMs,
  children,
}: {
  className?: string
  /** Lead a RevealGroup as the growing tile: opens first, then the group's content
   * reveal starts partway through that growth. */
  lead?: boolean
  /** Fixed cascade slot when inside a RevealGroup (same index = clip together). */
  index?: number
  /** Override the clip-open duration (ms). A large content tile reads slower/heavier
   * than a small image, so it can grow over a longer time. */
  durationMs?: number
  children: ReactNode
}) {
  const ref = useClipOpen<HTMLDivElement>({ lead, index, durationMs })
  return (
    <div ref={ref as Ref<HTMLDivElement>} className={className}>
      {children}
    </div>
  )
}
