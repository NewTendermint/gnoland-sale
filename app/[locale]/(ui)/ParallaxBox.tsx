"use client"

import { useClipOpen, useMotion } from "@/lib/motion/use-motion"
import { type ReactNode, useCallback } from "react"
import { SceneImage, type SceneImageProps } from "./SceneImage"
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
  scene?: SceneImageProps
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
  scene,
  sceneVideo,
}: Props) {
  const { triggerRef, targetRef } = useMotion<HTMLDivElement>({
    type: "parallax",
    distance: strength,
  })
  // Keep fromBottomPct in sync with SceneVideo's observeReveal threshold.
  const clipRef = useClipOpen<HTMLDivElement>({
    immediate,
    delayMs,
    direction,
    index,
    fromBottomPct: 20,
  })
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
        {sceneVideo ? (
          <SceneVideo {...sceneVideo} immediate={immediate} />
        ) : scene ? (
          <SceneImage {...scene} />
        ) : (
          children
        )}
      </div>
    </div>
  )
}
