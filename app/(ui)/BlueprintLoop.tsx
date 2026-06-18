"use client"

import { useEffect, useRef } from "react"
import { observeReveal } from "../../lib/motion/reveal-group"
import { shouldAnimate } from "../../lib/motion/should-animate"

const REST_OPACITY = "0.4"
const FADE_MS = 900

export function BlueprintLoop() {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !shouldAnimate()) return
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
    return () => {
      stop()
      el.style.opacity = ""
      el.style.transition = ""
    }
  }, [])
  return (
    <div aria-hidden className="flex w-full justify-center">
      <div className="w-[34%]">
        <video
          ref={ref}
          autoPlay
          muted
          loop
          playsInline
          poster="/sprites/blueprint-loop.poster.jpg?v=7"
          className="block w-full opacity-40 mix-blend-difference"
        >
          <source src="/sprites/blueprint-loop.mp4?v=6" type="video/mp4" />
        </video>
      </div>
    </div>
  )
}
