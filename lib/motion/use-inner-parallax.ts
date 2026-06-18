"use client"

import { useEffect, useRef } from "react"

// Pure scroll->drift mapping in [-maxTravel, maxTravel], 0 when centered. Exported for unit tests.
export function computeDriftY(
  elTop: number,
  elHeight: number,
  viewportH: number,
  maxTravel: number,
): number {
  if (viewportH <= 0) return 0
  const p = Math.min(1, Math.max(0, (elTop + elHeight) / (viewportH + elHeight)))
  // (p - 0.5): inner content drifts UP as the slot rises through the viewport.
  return (p - 0.5) * 2 * maxTravel
}

type Ctx = { top: number; height: number }
type Sub = (ctx: Ctx) => void

// One shared passive listener + rAF for every slot. The scroll container is `.screen`.
const subs = new Set<Sub>()
let raf = 0
let listening = false
let screenEl: HTMLElement | null = null

function getScreen(): HTMLElement | null {
  if (!screenEl) screenEl = document.querySelector<HTMLElement>(".screen")
  return screenEl
}

function currentCtx(): Ctx {
  const r = getScreen()?.getBoundingClientRect()
  return { top: r?.top ?? 0, height: r?.height ?? window.innerHeight }
}

function tick() {
  raf = 0
  const ctx = currentCtx()
  for (const s of subs) s(ctx)
}

function onScroll() {
  if (!raf) raf = requestAnimationFrame(tick)
}

function subscribe(fn: Sub): () => void {
  subs.add(fn)
  const el = getScreen()
  if (el && !listening) {
    el.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    listening = true
  }
  fn(currentCtx())
  return () => {
    subs.delete(fn)
    if (subs.size === 0 && listening) {
      getScreen()?.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      listening = false
      screenEl = null
    }
  }
}

const DEFAULT_STRENGTH = 0.12

// Internal scroll parallax: drifts the ref'd element vertically inside its clipped frame.
// `strength` (peak drift as a fraction of element height) must stay <= the slot's overflow headroom.
export function useInnerParallax<T extends HTMLElement>({
  strength = DEFAULT_STRENGTH,
}: { strength?: number } = {}) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const apply = (ctx: Ctx) => {
      const rect = el.getBoundingClientRect()
      const y = computeDriftY(rect.top - ctx.top, rect.height, ctx.height, rect.height * strength)
      el.style.transform = `translateY(${y.toFixed(2)}px)`
    }
    const unsub = subscribe(apply)
    return () => {
      unsub()
      el.style.transform = ""
    }
  }, [strength])
  return ref
}
