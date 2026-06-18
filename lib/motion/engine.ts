"use client"

// Lazy-loaded GSAP motion engine, encapsulated so call sites never import GSAP directly.

async function create() {
  const [gsapMod, stMod, splitMod] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/SplitText"),
  ])
  const { gsap } = gsapMod
  const { ScrollTrigger } = stMod
  const { SplitText } = splitMod
  gsap.registerPlugin(ScrollTrigger, SplitText)
  ScrollTrigger.defaults({ scroller: ".screen" })
  return { gsap, ScrollTrigger, SplitText }
}

let enginePromise: ReturnType<typeof create> | null = null

export function loadEngine() {
  if (!enginePromise) enginePromise = create()
  return enginePromise
}
