"use client"

import { useEffect, useRef } from "react"

/**
 * External scroll parallax on the `.screen` container, shared across every
 * registered element.
 *
 * Design goals (from docs/specs/2026-06-04-webgl-motion-system-design.md):
 * - Native scroll only: we read `.screen` scroll position, we never hijack it.
 * - One passive scroll listener + one rAF loop for ALL boxes (not one each).
 * - Render-on-demand: the loop runs only while something is still moving and
 *   stops the instant every box has settled, so idle = 0 CPU/GPU (no fans).
 * - The translate value is lerped toward its scroll target for a smooth feel.
 * - prefers-reduced-motion disables it entirely.
 */

type Target = { el: HTMLElement; strength: number; current: number }

const targets = new Set<Target>()
let screenEl: HTMLElement | null = null
let running = false
let listening = false
let reduced = false

function getScreen(): HTMLElement | null {
  if (!screenEl || !screenEl.isConnected) {
    screenEl = document.querySelector<HTMLElement>(".screen")
  }
  return screenEl
}

function tick() {
  const sc = getScreen()
  if (!sc) {
    running = false
    return
  }
  const vh = sc.clientHeight
  const scTop = sc.getBoundingClientRect().top
  let active = false
  for (const t of targets) {
    const r = t.el.getBoundingClientRect()
    // r.top already includes the transform we applied last frame; subtract it
    // to recover the untransformed position and avoid a feedback loop.
    const baseTop = r.top - t.current
    const center = baseTop - scTop + r.height / 2
    const progress = vh > 0 ? (center - vh / 2) / vh : 0
    // Center-anchored: the box is nudged toward viewport center, so it lags
    // the scroll and appears to float. Self-limiting to about +/- strength/2.
    const targetOffset = -progress * t.strength
    const next = t.current + (targetOffset - t.current) * 0.12
    if (Math.abs(targetOffset - next) > 0.05) active = true
    t.current = next
    t.el.style.transform = `translate3d(0, ${next.toFixed(2)}px, 0)`
  }
  if (active) {
    requestAnimationFrame(tick)
  } else {
    running = false
    for (const t of targets) {
      t.el.style.willChange = "auto"
    }
  }
}

function wake() {
  if (reduced || running || targets.size === 0) return
  running = true
  for (const t of targets) {
    t.el.style.willChange = "transform"
  }
  requestAnimationFrame(tick)
}

function startListening() {
  if (listening) return
  listening = true
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  getScreen()?.addEventListener("scroll", wake, { passive: true })
  window.addEventListener("resize", wake, { passive: true })
}

/**
 * Registers an element for `.screen` scroll parallax. Attach the returned ref
 * to the element. `strength` is the peak travel in pixels (about +/- strength/2).
 */
export function useParallax<T extends HTMLElement>(strength = 90) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    startListening()
    const target: Target = { el, strength, current: 0 }
    targets.add(target)
    wake() // ease into the initial parallax offset for the load position
    return () => {
      targets.delete(target)
      el.style.transform = ""
      el.style.willChange = "auto"
    }
  }, [strength])
  return ref
}
