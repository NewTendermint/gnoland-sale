"use client"

/**
 * GSAP motion engine, encapsulated so call sites never import GSAP directly
 * (keeps the engine swappable - `lib/motion/use-parallax.ts` is the lean
 * fallback). Lazy-loaded once on the client; ScrollTrigger is bound to the
 * `.screen` scroll container, never `window`. Native scroll only - we use
 * `scrub` for value-lerp, never ScrollSmoother (no smooth-scroll on the page).
 */

async function create() {
  const [gsapMod, stMod, splitMod] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/SplitText"),
  ])
  const { gsap } = gsapMod
  const { ScrollTrigger } = stMod
  // SplitText is free + public since GSAP 3.13 (we pin 3.15) - no Club registry.
  const { SplitText } = splitMod
  gsap.registerPlugin(ScrollTrigger, SplitText)
  // Every ScrollTrigger reads the `.screen` container instead of the window.
  ScrollTrigger.defaults({ scroller: ".screen" })
  return { gsap, ScrollTrigger, SplitText }
}

let enginePromise: ReturnType<typeof create> | null = null

export function loadEngine() {
  if (!enginePromise) enginePromise = create()
  return enginePromise
}
