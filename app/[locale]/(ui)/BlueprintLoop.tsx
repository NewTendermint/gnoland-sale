"use client"

import { observeReveal } from "@/lib/motion/reveal-group"
import { shouldAnimate } from "@/lib/motion/should-animate"
import { useEffect, useRef, useState } from "react"

const REST_OPACITY = "0.6"
const FADE_MS = 900
const POSTER = "/sprites/blueprint-loop.poster.jpg?v=8"

export function BlueprintLoop() {
  const ref = useRef<HTMLVideoElement>(null)
  // The <video> only exists on the animated path (desktop, motion allowed): rendering it with
  // autoPlay unconditionally would download, decode and loop the clip on mobile and under
  // prefers-reduced-motion, where the poster is the whole experience.
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    if (shouldAnimate()) setAnimate(true)
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el || !animate) return
    el.style.opacity = "0"
    let done = false
    const show = () => {
      if (done) return
      done = true
      el.style.transition = `opacity ${FADE_MS}ms ease`
      void el.offsetWidth
      el.style.opacity = REST_OPACITY
    }
    const stop = observeReveal(el, 40, show)
    // A loop has no natural end: keep the decoder idle while the section is offscreen.
    const io = new IntersectionObserver(([entry]) => {
      if (!entry) return
      if (entry.isIntersecting) el.play().catch(() => {})
      else el.pause()
    })
    io.observe(el)
    return () => {
      stop()
      io.disconnect()
      el.style.opacity = ""
      el.style.transition = ""
    }
  }, [animate])
  return (
    <div aria-hidden className="flex w-full justify-center">
      <div className="w-[34%]">
        {animate ? (
          <video
            ref={ref}
            autoPlay
            muted
            loop
            playsInline
            poster={POSTER}
            className="block w-full opacity-60 mix-blend-difference"
          >
            <source
              src="/sprites/blueprint-loop.av1.mp4?v=6"
              type="video/mp4; codecs=av01.0.08M.08"
            />
            <source src="/sprites/blueprint-loop.webm?v=6" type="video/webm; codecs=vp9" />
            <source src="/sprites/blueprint-loop.mp4?v=6" type="video/mp4" />
          </video>
        ) : (
          <img
            src={POSTER}
            alt=""
            draggable={false}
            loading="lazy"
            decoding="async"
            className="block w-full opacity-60 mix-blend-difference"
          />
        )}
      </div>
    </div>
  )
}
