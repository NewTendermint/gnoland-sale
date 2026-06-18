"use client"

import { useEffect, useRef, useState } from "react"
import { observeReveal } from "../../lib/motion/reveal-group"
import { shouldAnimate } from "../../lib/motion/should-animate"
import { useInnerParallax } from "../../lib/motion/use-inner-parallax"

type Source = { src: string; type: string }

export type SceneVideoProps = {
  sources: Source[]
  poster: string
  innerDelayMs?: number
  innerMs?: number
  immediate?: boolean
}

const EASE_CLIP = "cubic-bezier(0.22, 1, 0.36, 1)" // keep in sync with useClipOpen's EASE_CLIP
const SCALE_REST = 1.3 // == SceneImage's scale-[1.3]
const SCALE_FROM = 1.16
const FADE_MS = 250

export function SceneVideo({
  sources,
  poster,
  innerDelayMs = 600,
  innerMs = 1200,
  immediate = false,
}: SceneVideoProps) {
  const driftRef = useInnerParallax<HTMLDivElement>()
  const boxRef = useRef<HTMLDivElement>(null)
  const fadeTimer = useRef(0)
  const [armed, setArmed] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [videoShown, setVideoShown] = useState(true)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    if (!shouldAnimate()) {
      setRevealed(true)
      return
    }
    setArmed(true)
    const reveal = () => {
      setRevealed(true)
      setVideoShown(true)
      setPlaying(true)
    }
    let timer = 0
    if (immediate) {
      timer = window.setTimeout(reveal, innerDelayMs)
      return () => {
        clearTimeout(timer)
        clearTimeout(fadeTimer.current)
      }
    }
    // Keep this 20 in sync with ParallaxBox's fromBottomPct.
    const stop = observeReveal(box, 20, () => {
      timer = window.setTimeout(reveal, innerDelayMs)
    })
    return () => {
      stop()
      clearTimeout(timer)
      clearTimeout(fadeTimer.current)
    }
  }, [innerDelayMs, immediate])

  const onEnded = () => {
    setVideoShown(false)
    clearTimeout(fadeTimer.current)
    fadeTimer.current = window.setTimeout(() => setPlaying(false), FADE_MS + 40)
  }

  const ease = armed ? `transform ${innerMs}ms ${EASE_CLIP}` : "none"

  return (
    <div ref={boxRef} className="absolute inset-0">
      <div ref={driftRef} className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${revealed ? SCALE_REST : SCALE_FROM})`,
            transformOrigin: "center",
            transition: ease,
          }}
        >
          <img
            src={poster}
            alt=""
            draggable={false}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {playing && (
            <video
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={onEnded}
              style={{ opacity: videoShown ? 1 : 0, transition: `opacity ${FADE_MS}ms ease` }}
              className="absolute inset-0 h-full w-full object-cover"
            >
              {sources.map((s) => (
                <source key={s.src} src={s.src} type={s.type} />
              ))}
            </video>
          )}
        </div>
      </div>
      <div
        aria-hidden
        className="absolute inset-0 bg-surface-alt"
        style={{
          transform: `translateY(${revealed ? "100%" : "0%"})`,
          transition: ease,
        }}
      />
    </div>
  )
}
