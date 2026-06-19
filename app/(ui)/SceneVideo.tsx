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
}

const EASE_CLIP = "cubic-bezier(0.22, 1, 0.36, 1)" // keep in sync with useClipOpen's EASE_CLIP
const SCALE_REST = 1.25 // == SceneImage's scale-[1.25] (slight de-zoom; stays >= parallax headroom)
const SCALE_FROM = 1.16
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
}: SceneVideoProps) {
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
      // Play first, then slide the grey cover a beat later (COVER_LEAD_MS) so a decoder
      // cold-start stutters behind the cover, not in view.
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
    // Preload the video EARLY: during the first idle window after the hero loads (NOT when the
    // slot is displayed), so every scene is already buffered and plays instantly at its reveal.
    // Low priority (idle) so it never competes with the hero. The approach observer is a
    // fallback for a scroll that beats the idle callback.
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

  // Play the instant the reveal fires (the grey cover starts sliding). For the hero the
  // <video> is already mounted + buffered, so play() is immediate - the spin starts in sync
  // with the cover, with no static-poster gap.
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
            transform: `scale(${revealed ? SCALE_REST : SCALE_FROM})`,
            transformOrigin: "center",
            transition: ease,
          }}
        >
          <img
            src={poster}
            alt=""
            draggable={false}
            // Hero (immediate) is above the fold: load its poster eagerly + at high priority
            // (it's the largest first-paint asset). Below-fold slots stay lazy.
            loading={immediate ? "eager" : "lazy"}
            fetchPriority={immediate ? "high" : "auto"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Mount + buffer the <video> AHEAD of the reveal (immediately for the hero, ~1
              viewport early for scroll slots) so it plays the instant the cover slides - no
              static-poster gap. Unmounts after the spin ends to free the decoder. */}
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
