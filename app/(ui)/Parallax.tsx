"use client"

import type { ReactNode } from "react"
import { useMotion } from "../../lib/motion/use-motion"

/**
 * Floats any block with external scroll parallax (shared motion module, GSAP under
 * the hood) - no background, no clip of its own, unlike ParallaxBox (the grey image
 * slot). The OUTER element is the stable trigger (defines the scroll range, never
 * moves); the INNER element floats. Keeping them separate runs the parallax the
 * whole time the block is visible. Compose with ClipOpen / RevealGroup for a content
 * tile that both clips open and parallaxes. Desktop only; reduced-motion / touch: no
 * motion, the block sits still.
 */
export function Parallax({
  strength,
  className = "",
  children,
}: {
  /** Peak vertical travel in px across the block's transit. */
  strength?: number
  className?: string
  children: ReactNode
}) {
  const { triggerRef, targetRef } = useMotion<HTMLDivElement>({
    type: "parallax",
    distance: strength,
  })
  return (
    <div ref={triggerRef} className={className}>
      <div ref={targetRef}>{children}</div>
    </div>
  )
}
