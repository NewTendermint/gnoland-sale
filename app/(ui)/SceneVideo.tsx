"use client"

import { useEffect, useRef, useState } from "react"
import { signalHeroMediaReady, whenReady } from "../../lib/motion/app-ready"
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
  scaleRest?: number
}

const EASE_CLIP = "cubic-bezier(0.22, 1, 0.36, 1)" // keep in sync with useClipOpen's EASE_CLIP
const SCALE_REST = 1.25 // == SceneImage's scale-[1.25] (slight de-zoom; stays >= parallax headroom)
const SCALE_FROM = 1.16
const REVEAL_ZOOM = SCALE_REST - SCALE_FROM
const FADE_MS = 250
// Start the video this long before sliding the grey cover, so a decoder cold-start stutters
// behind the cover (out of view), not on screen.
const COVER_LEAD_MS = 70

export function SceneVideo({
  sources,
  poster,
  innerDelayMs = 600,
  innerMs = 1200,
  immediate = false,
  scaleRest = SCALE_REST,
}: SceneVideoProps) {
  const fromScale = scaleRest - REVEAL_ZOOM
  const driftRef = useInnerParallax<HTMLDivElement>()
  const boxRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fadeTimer = useRef(0)
  const [armed, setArmed] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [videoShown, setVideoShown] = useState(true)
  const [ended, setEnded] = useState(false)
  const [preload, setPreload] = useState(false)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    if (!shouldAnimate()) {
      setRevealed(true)
      return
    }
    setArmed(true)
    let timer = 0
    let coverTimer = 0
    const reveal = () => {
      setVideoShown(true)
      setPlaying(true)
      coverTimer = window.setTimeout(() => setRevealed(true), COVER_LEAD_MS)
    }
    if (immediate) {
      // Buffer the hero video NOW (the Loader waits on its canplaythrough), but hold the reveal
      // until the loading cover dismisses (whenReady), so the spin plays on a clean stage.
      setPreload(true)
      const off = whenReady(() => {
        timer = window.setTimeout(reveal, innerDelayMs)
      })
      return () => {
        off()
        clearTimeout(timer)
        clearTimeout(coverTimer)
        clearTimeout(fadeTimer.current)
      }
    }
    // Idle-callback preload with IntersectionObserver fallback; keeps pressure off the hero.
    const supportsIdle = typeof requestIdleCallback === "function"
    const idleId = supportsIdle
      ? requestIdleCallback(() => setPreload(true), { timeout: 2500 })
      : window.setTimeout(() => setPreload(true), 1500)
    const preloadIo = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setPreload(true)
          preloadIo.disconnect()
        }
      },
      { rootMargin: "0px 0px 100% 0px", threshold: 0 },
    )
    preloadIo.observe(box)
    // Keep this 20 in sync with ParallaxBox's fromBottomPct.
    const stop = observeReveal(box, 20, () => {
      timer = window.setTimeout(reveal, innerDelayMs)
    })
    return () => {
      if (supportsIdle) cancelIdleCallback(idleId)
      else clearTimeout(idleId)
      preloadIo.disconnect()
      stop()
      clearTimeout(timer)
      clearTimeout(coverTimer)
      clearTimeout(fadeTimer.current)
    }
  }, [innerDelayMs, immediate])

  useEffect(() => {
    if (playing) videoRef.current?.play().catch(() => {})
  }, [playing])

  const onEnded = () => {
    setVideoShown(false)
    clearTimeout(fadeTimer.current)
    fadeTimer.current = window.setTimeout(() => {
      setPlaying(false)
      setEnded(true)
    }, FADE_MS + 40)
  }

  const ease = armed ? `transform ${innerMs}ms ${EASE_CLIP}` : "none"

  return (
    <div ref={boxRef} className="absolute inset-0">
      <div ref={driftRef} className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${revealed ? scaleRest : fromScale})`,
            transformOrigin: "center",
            transition: ease,
          }}
        >
          <img
            src={poster}
            alt=""
            draggable={false}
            loading={immediate ? "eager" : "lazy"}
            fetchPriority={immediate ? "high" : "auto"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Preloaded ahead of reveal; unmounted after spin to free the decoder. */}
          {preload && !ended && (
            <video
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              onEnded={onEnded}
              onCanPlayThrough={immediate ? () => signalHeroMediaReady() : undefined}
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
