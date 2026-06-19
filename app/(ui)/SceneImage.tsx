"use client"

import { useInnerParallax } from "../../lib/motion/use-inner-parallax"

export type SceneImageProps = {
  light: string
  dark: string
  alt?: string
  priority?: boolean
  /** object-position X in %, the horizontal framing. */
  focusX?: number
  /** Peak internal drift as a fraction of the frame height. */
  strength?: number
}

export function SceneImage({
  light,
  dark,
  alt = "",
  priority = false,
  focusX = 50,
  strength,
}: SceneImageProps) {
  const driftRef = useInnerParallax<HTMLDivElement>(strength != null ? { strength } : undefined)
  const objectPosition = `${focusX}% center`
  const loading = priority ? "eager" : "lazy"
  const fetchPriority = priority ? "high" : "auto"
  const imgClass = "absolute inset-0 h-full w-full scale-[1.25] object-cover"
  return (
    <div ref={driftRef} className="absolute inset-0">
      <img
        src={light}
        alt={alt}
        draggable={false}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        style={{ objectPosition }}
        className={`${imgClass} dark:hidden`}
      />
      <img
        src={dark}
        alt={alt}
        draggable={false}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        style={{ objectPosition }}
        className={`${imgClass} hidden dark:block`}
      />
    </div>
  )
}
