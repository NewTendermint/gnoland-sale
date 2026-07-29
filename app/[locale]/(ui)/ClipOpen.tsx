"use client"

import { useWipeOpen } from "@/lib/motion/use-motion"
import type { ReactNode } from "react"

export function ClipOpen({
  className = "",
  lead = false,
  index,
  durationMs,
  fromBottomPct,
  children,
}: {
  className?: string
  lead?: boolean
  index?: number
  durationMs?: number
  fromBottomPct?: number
  children: ReactNode
}) {
  const { ref, paneRef } = useWipeOpen<HTMLDivElement>({
    lead,
    index,
    durationMs,
    fromBottomPct,
  })
  return (
    <div ref={ref} className={`relative ${className}`}>
      {children}
      {/* Reveal pane (see useWipeOpen), in a shell that clips its shadow to the box whatever
          classes the caller passes. pointer-events-none: the shell covers the whole box. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
      >
        <div
          ref={paneRef}
          className="h-full w-full rounded-[inherit] shadow-[0_0_0_100vmax_var(--background)]"
        />
      </div>
    </div>
  )
}
