"use client"

import { useMotion, useWipeOpen } from "@/lib/motion/use-motion"
import { type ReactNode, useCallback } from "react"
import { SceneVideo, type SceneVideoProps } from "./SceneVideo"

type Props = {
  className?: string
  strength?: number
  immediate?: boolean
  delayMs?: number
  direction?: "up" | "down"
  index?: number
  "aria-label"?: string
  children?: ReactNode
  /** Scene video for this slot; takes precedence over `scene` / `children`. */
  sceneVideo?: SceneVideoProps
}

export function ParallaxBox({
  className = "",
  strength,
  immediate = false,
  delayMs = 0,
  direction = "down",
  index,
  "aria-label": ariaLabel,
  children,
  sceneVideo,
}: Props) {
  const { triggerRef, targetRef } = useMotion<HTMLDivElement>({
    type: "parallax",
    distance: strength,
  })
  // Keep fromBottomPct in sync with SceneVideo's observeReveal threshold. Lower than ~40 and the
  // box opens with a sliver of itself on screen, so the wipe is over before it is in view.
  const { ref: boxRef, paneRef } = useWipeOpen<HTMLDivElement>({
    immediate,
    delayMs,
    direction,
    index,
    fromBottomPct: 40,
  })
  const setInner = useCallback(
    (el: HTMLDivElement | null) => {
      targetRef.current = el
      boxRef.current = el
    },
    [targetRef, boxRef],
  )
  return (
    <div ref={triggerRef} className={`${className} w-full`}>
      <div
        ref={setInner}
        aria-label={ariaLabel}
        className="relative h-full w-full overflow-hidden top-8 rounded-[var(--frame-radius)] bg-surface-alt"
      >
        {sceneVideo ? <SceneVideo {...sceneVideo} immediate={immediate} /> : children}
        {/* Reveal pane (see useWipeOpen); the box already clips its shadow, being overflow-hidden
            and rounded, so this one needs no shell of its own. */}
        <div
          ref={paneRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] shadow-[0_0_0_100vmax_var(--background)]"
        />
      </div>
    </div>
  )
}
