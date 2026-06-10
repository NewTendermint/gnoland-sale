"use client"

import { type ReactNode, useCallback } from "react"
import { useClipOpen, useMotion } from "../../lib/motion/use-motion"

type Props = {
  className?: string
  /** Peak parallax travel in px (mapped to the motion engine distance). */
  strength?: number
  /** Open the box on mount instead of on scroll (for an above-the-fold box). */
  immediate?: boolean
  /** Extra delay before the clip-open (for sequencing a coordinated entrance). */
  delayMs?: number
  /** Clip wipe direction: "up" (the hero intro) or "down" (default for section images). */
  direction?: "up" | "down"
  /** Cascade slot when inside a RevealGroup (same index = fire together). */
  index?: number
  "aria-label"?: string
  children?: ReactNode
}

/**
 * The grey scene slot with external scroll parallax (shared motion module, GSAP
 * under the hood). The OUTER element is the stable trigger (it defines the
 * scroll range and never moves); the INNER element is what actually floats.
 * Separating them keeps the parallax running the whole time the slot is visible
 * (animating the trigger itself would shift its bounds and stop it early).
 * See docs/specs/2026-06-04-webgl-motion-system-design.md.
 */
export function ParallaxBox({
  className = "",
  strength,
  immediate = false,
  delayMs = 0,
  direction = "down",
  index,
  "aria-label": ariaLabel,
  children,
}: Props) {
  const { triggerRef, targetRef } = useMotion<HTMLDivElement>({
    type: "parallax",
    distance: strength,
  })
  // The inner box both floats (parallax target) and opens like a window
  // (clip-open). Merge the two refs onto it.
  const clipRef = useClipOpen<HTMLDivElement>({ immediate, delayMs, direction, index })
  const setInner = useCallback(
    (el: HTMLDivElement | null) => {
      targetRef.current = el
      clipRef.current = el
    },
    [targetRef, clipRef],
  )
  return (
    <div ref={triggerRef} className={`${className} w-full`}>
      <div
        ref={setInner}
        aria-label={ariaLabel}
        className="relative h-full w-full overflow-hidden top-8 rounded-[var(--frame-radius)] bg-surface-alt"
      >
        {children}
      </div>
    </div>
  )
}
