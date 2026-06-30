"use client"

import { useContext, useEffect, useRef } from "react"
import { LG_MEDIA_QUERY } from "../device/breakpoints"
import { useMediaQuery } from "../device/use-media-query"
import { whenReady } from "./app-ready"
import { loadEngine } from "./engine"
import { RevealGroupContext, doubleRaf, observeReveal, wireReveal } from "./reveal-group"
import { shouldAnimate } from "./should-animate"

const EASE_REVEAL = "cubic-bezier(0.16, 1, 0.3, 1)"
const EASE_CLIP = "cubic-bezier(0.22, 1, 0.36, 1)"

type MotionConfig = {
  type: "parallax"
  /** Total vertical travel in px across the element's transit. */
  distance?: number
  /** Scrub smoothing in seconds (the value-lerp). 0 = locked to scroll. */
  lerp?: number
}

// Declarative scroll motion. `triggerRef` defines when it runs; `targetRef` is what moves.
export function useMotion<T extends HTMLElement>({
  type,
  distance = 320,
  lerp = 0.6,
}: MotionConfig) {
  const triggerRef = useRef<T>(null)
  const targetRef = useRef<T>(null)
  const wide = useMediaQuery(LG_MEDIA_QUERY)
  useEffect(() => {
    const trigger = triggerRef.current
    const target = targetRef.current
    if (!trigger || !target || !shouldAnimate() || !wide) return
    let killed = false
    let cleanup: (() => void) | undefined
    loadEngine().then(({ gsap }) => {
      if (killed || !triggerRef.current || !targetRef.current) return
      if (type === "parallax") {
        const tween = gsap.fromTo(
          target,
          { y: -distance / 2 },
          {
            y: distance / 2,
            ease: "none",
            scrollTrigger: {
              trigger,
              start: `top bottom+=${distance / 2}`,
              end: `bottom top-=${distance / 2}`,
              scrub: lerp,
            },
          },
        )
        cleanup = () => {
          tween.scrollTrigger?.kill()
          tween.kill()
          gsap.set(target, { clearProps: "transform" })
        }
      }
    })
    return () => {
      killed = true
      cleanup?.()
    }
  }, [type, distance, lerp, wide])
  return { triggerRef, targetRef }
}

// One-shot left-to-right "draw" for a horizontal line. The ref goes on a full-box wrapper
// (its single child draws); the wrapper keeps real area so the IntersectionObserver fires.
export function useDrawLine<T extends HTMLElement>({
  durationMs = 2200,
  fromBottomPct = 20,
  immediate = false,
  delayMs = 0,
  index,
}: {
  durationMs?: number
  fromBottomPct?: number
  immediate?: boolean
  delayMs?: number
  index?: number
} = {}) {
  const group = useContext(RevealGroupContext)
  const ref = useRef<T>(null)
  useEffect(() => {
    const wrap = ref.current
    if (!wrap || !shouldAnimate()) return
    const line = wrap.firstElementChild as HTMLElement | null
    if (!line) return
    line.style.transformOrigin = "left center"
    line.style.transform = "scaleX(0)"
    const draw = (extra = 0) => {
      line.style.transition = "none"
      line.style.transform = "scaleX(0)"
      void line.offsetWidth
      line.style.transition = `transform ${durationMs}ms ${EASE_REVEAL} ${delayMs + extra}ms`
      line.style.transform = "scaleX(1)"
    }
    const reset = () => {
      line.style.transition = ""
      line.style.transform = ""
      line.style.transformOrigin = ""
    }
    return wireReveal(wrap, draw, reset, {
      immediate,
      group,
      index,
      duration: durationMs,
      fromBottomPct,
      decorative: true,
    })
  }, [durationMs, fromBottomPct, immediate, delayMs, group, index])
  return ref
}

// Element-level mask rise: a full-box wrapper clips overflow, its single child slides up.
export function useRise<T extends HTMLElement>({
  durationMs = 800,
  fromBottomPct = 20,
  immediate = false,
  delayMs = 0,
  index,
}: {
  durationMs?: number
  fromBottomPct?: number
  immediate?: boolean
  delayMs?: number
  index?: number
} = {}) {
  const group = useContext(RevealGroupContext)
  const ref = useRef<T>(null)
  useEffect(() => {
    const wrap = ref.current
    if (!wrap || !shouldAnimate()) return
    const inner = wrap.firstElementChild as HTMLElement | null
    if (!inner) return
    inner.style.transform = "translateY(110%)"
    const reveal = (extra = 0) => {
      inner.style.transition = `transform ${durationMs}ms ${EASE_REVEAL} ${delayMs + extra}ms`
      void inner.offsetWidth
      inner.style.transform = "translateY(0)"
    }
    const reset = () => {
      inner.style.transition = ""
      inner.style.transform = ""
    }
    return wireReveal(wrap, reveal, reset, {
      immediate,
      group,
      index,
      duration: durationMs,
      fromBottomPct,
    })
  }, [durationMs, fromBottomPct, immediate, delayMs, group, index])
  return ref
}

// Cuberto-style text reveal: split into masked lines (GSAP SplitText), each slides up on scroll.
export function useReveal<T extends HTMLElement>({
  immediate = false,
  staggerMs = 85,
  durationMs = 800,
  fromBottomPct = 20,
  type = "lines",
  delayMs = 0,
  index,
}: {
  immediate?: boolean
  staggerMs?: number
  durationMs?: number
  fromBottomPct?: number
  type?: "lines" | "words"
  delayMs?: number
  index?: number
} = {}) {
  const group = useContext(RevealGroupContext)
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !shouldAnimate()) return
    let killed = false
    let split: { revert: () => void } | undefined
    let teardown: (() => void) | undefined
    let played = false
    if (immediate) el.style.visibility = "hidden"
    loadEngine()
      .then(async ({ SplitText }) => {
        if (killed || !ref.current) return
        // Split AFTER fonts load. With display:swap the fallback renders first, then Geist swaps
        // in and autoSplit re-splits on the reflow; a re-split after the reveal has played would
        // show the text in its end state with no animation (intermittent, Firefox font-load timing).
        // Capped so a hung fonts.ready never strands the text hidden.
        if (document.fonts?.ready) {
          await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))])
          if (killed || !ref.current) return
        }
        split = SplitText.create(el, {
          type: type,
          mask: type,
          autoSplit: true,
          aria: "auto",
          linesClass: "reveal-line",
          wordsClass: "reveal-word",
          onSplit: (self) => {
            const units = (type === "words" ? self.words : self.lines) as HTMLElement[]
            if (played) {
              el.style.visibility = ""
              teardown?.()
              teardown = undefined
              return
            }
            for (const line of units) line.style.transform = "translateY(110%)"
            const reveal = (extra = 0) => {
              played = true
              units.forEach((line, i) => {
                line.style.transition = `transform ${durationMs}ms ${EASE_REVEAL} ${delayMs + extra + i * staggerMs}ms`
              })
              void el.offsetWidth
              for (const line of units) line.style.transform = "translateY(0)"
            }
            el.style.visibility = ""
            teardown?.()
            teardown = wireReveal(el, reveal, () => {}, {
              immediate,
              group,
              index,
              duration: durationMs + (units.length - 1) * staggerMs,
              fromBottomPct,
            })
          },
        })
      })
      .catch(() => {
        el.style.visibility = ""
      })
    return () => {
      killed = true
      teardown?.()
      el.style.visibility = ""
      split?.revert()
    }
  }, [immediate, staggerMs, durationMs, fromBottomPct, type, delayMs, group, index])
  return ref
}

// Block "appear" stagger: the container's direct children fade + rise in one after another.
export function useStagger<T extends HTMLElement>({
  staggerMs = 70,
  durationMs = 600,
  yPx = 24,
  fromBottomPct = 20,
  delayMs = 0,
  immediate = false,
  active,
}: {
  staggerMs?: number
  durationMs?: number
  yPx?: number
  fromBottomPct?: number
  delayMs?: number
  immediate?: boolean
  /** Controlled (open/close) mode driven by this flag instead of scroll; plays on touch. */
  active?: boolean
} = {}) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const container = ref.current
    if (!container) return
    const items = Array.from(container.children) as HTMLElement[]
    if (!items.length) return

    if (active !== undefined) {
      if (!active) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        for (const item of items) {
          item.style.opacity = "1"
          item.style.transform = "none"
        }
        return
      }
      for (const item of items) {
        item.style.transition = "none"
        item.style.opacity = "0"
        item.style.transform = `translateY(${yPx}px)`
      }
      void container.offsetWidth
      items.forEach((item, i) => {
        const d = delayMs + i * staggerMs
        item.style.transition = `opacity ${durationMs}ms ease ${d}ms, transform ${durationMs}ms ${EASE_REVEAL} ${d}ms`
        item.style.opacity = "1"
        item.style.transform = "translateY(0)"
      })
      return
    }

    if (!shouldAnimate()) return
    for (const item of items) {
      item.style.opacity = "0"
      item.style.transform = `translateY(${yPx}px)`
    }
    const show = () => {
      for (const item of items) {
        item.style.transition = "none"
        item.style.opacity = "0"
        item.style.transform = `translateY(${yPx}px)`
      }
      void container.offsetWidth
      items.forEach((item, i) => {
        const d = delayMs + i * staggerMs
        item.style.transition = `opacity ${durationMs}ms ease ${d}ms, transform ${durationMs}ms ${EASE_REVEAL} ${d}ms`
        item.style.opacity = "1"
        item.style.transform = "translateY(0)"
      })
    }
    const reset = () => {
      for (const item of items) {
        item.style.opacity = ""
        item.style.transform = ""
        item.style.transition = ""
        item.style.transitionDelay = ""
      }
    }
    if (immediate) {
      let cancel = () => {}
      const off = whenReady(() => {
        cancel = doubleRaf(show)
      })
      return () => {
        off()
        cancel()
        reset()
      }
    }
    const stop = observeReveal(container, fromBottomPct, show)
    return () => {
      stop()
      reset()
    }
  }, [staggerMs, durationMs, yPx, fromBottomPct, delayMs, immediate, active])
  return ref
}

// Single-element fade in (opacity + a small rise) on scroll-in.
export function useFade<T extends HTMLElement>({
  durationMs = 600,
  yPx = 14,
  fromBottomPct = 20,
  delayMs = 0,
  immediate = false,
  index,
}: {
  durationMs?: number
  yPx?: number
  fromBottomPct?: number
  delayMs?: number
  immediate?: boolean
  index?: number
} = {}) {
  const group = useContext(RevealGroupContext)
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !shouldAnimate()) return
    el.style.opacity = "0"
    el.style.transform = `translateY(${yPx}px)`
    const show = (extra = 0) => {
      el.style.transition = `opacity ${durationMs}ms ease ${delayMs + extra}ms, transform ${durationMs}ms ${EASE_REVEAL} ${delayMs + extra}ms`
      void el.offsetWidth
      el.style.opacity = "1"
      el.style.transform = "translateY(0)"
    }
    const reset = () => {
      el.style.opacity = ""
      el.style.transform = ""
      el.style.transition = ""
    }
    return wireReveal(el, show, reset, {
      immediate,
      group,
      index,
      duration: durationMs,
      fromBottomPct,
    })
  }, [durationMs, yPx, fromBottomPct, delayMs, immediate, group, index])
  return ref
}

// Count-up for a key figure: on scroll-in the numeric run tweens 0 -> target, prefix/suffix preserved.
export function useCountUp<T extends HTMLElement>(
  value: string,
  {
    durationMs = 1500,
    fromBottomPct = 12,
    immediate = false,
    index,
    fadeMs = 600,
  }: {
    durationMs?: number
    fromBottomPct?: number
    immediate?: boolean
    index?: number
    fadeMs?: number
  } = {},
) {
  const group = useContext(RevealGroupContext)
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const match = value.match(/^(\D*)([\d,]+)(.*)$/)
    if (!match || !shouldAnimate()) return
    const prefix = match[1]
    const target = Number.parseInt(match[2].replace(/,/g, ""), 10)
    const suffix = match[3]
    el.textContent = `${prefix}0${suffix}`
    el.style.opacity = "0"
    let raf = 0
    let timer = 0
    let killed = false
    const run = (extra = 0) => {
      el.style.transition = `opacity ${fadeMs}ms ease ${extra}ms`
      void el.offsetWidth
      el.style.opacity = "1"
      const begin = () => {
        let start = 0
        const step = (t: number) => {
          if (killed) return
          if (!start) start = t
          const p = Math.min((t - start) / durationMs, 1)
          const eased = 1 - (1 - p) ** 3
          el.textContent = `${prefix}${Math.round(eased * target).toLocaleString("en-US")}${suffix}`
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      }
      if (extra > 0) timer = window.setTimeout(begin, extra)
      else begin()
    }
    const cleanup = () => {
      killed = true
      if (raf) cancelAnimationFrame(raf)
      if (timer) clearTimeout(timer)
      el.style.opacity = ""
      el.style.transition = ""
    }
    return wireReveal(el, run, cleanup, {
      immediate,
      group,
      index,
      duration: durationMs,
      fromBottomPct,
    })
  }, [value, durationMs, fromBottomPct, immediate, group, index, fadeMs])
  return ref
}

// Self-drawing stroke icon: each stroke shape draws (dashoffset -> 0) on scroll-in. Stroke-only SVGs.
export function useDrawIcon<T extends SVGSVGElement>({
  durationMs = 1100,
  staggerMs = 60,
  fromBottomPct = 20,
  immediate = false,
  index,
}: {
  durationMs?: number
  staggerMs?: number
  fromBottomPct?: number
  immediate?: boolean
  index?: number
} = {}) {
  const group = useContext(RevealGroupContext)
  const ref = useRef<T>(null)
  useEffect(() => {
    const svg = ref.current
    if (!svg || !shouldAnimate()) return
    const shapes = svg.querySelectorAll<SVGGeometryElement>(
      "path, polyline, line, polygon, circle, ellipse, rect",
    )
    if (!shapes.length) return
    const lengths: number[] = []
    shapes.forEach((shape, i) => {
      let len = 0
      try {
        len = shape.getTotalLength()
      } catch {
        len = 0
      }
      lengths[i] = len
      if (!len) return
      shape.style.strokeDasharray = `${len}`
      shape.style.strokeDashoffset = `${len}`
    })
    const draw = (extra = 0) => {
      void svg.getBoundingClientRect()
      shapes.forEach((shape, i) => {
        if (!lengths[i]) return
        shape.style.transition = `stroke-dashoffset ${durationMs}ms ${EASE_REVEAL} ${extra + i * staggerMs}ms`
        shape.style.strokeDashoffset = "0"
      })
    }
    const reset = () => {
      for (const shape of shapes) {
        shape.style.strokeDasharray = ""
        shape.style.strokeDashoffset = ""
        shape.style.transition = ""
      }
    }
    return wireReveal(svg, draw, reset, {
      immediate,
      group,
      index,
      duration: 0,
      fromBottomPct,
      decorative: true,
    })
  }, [durationMs, staggerMs, fromBottomPct, immediate, group, index])
  return ref
}

// "Window opens" reveal for an image/scene box: clip-path expands the box, keeping rounded corners.
export function useClipOpen<T extends HTMLElement>({
  durationMs = 1500,
  fromBottomPct = 40,
  immediate = false,
  delayMs = 0,
  index,
  direction = "down",
  lead = false,
}: {
  durationMs?: number
  fromBottomPct?: number
  immediate?: boolean
  delayMs?: number
  index?: number
  /** Wipe direction: "up" = from the bottom edge upward, "down" = from the top edge downward. */
  direction?: "up" | "down"
  /** Lead the group as a growing panel: opens first, content starts partway through. */
  lead?: boolean
} = {}) {
  const group = useContext(RevealGroupContext)
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !shouldAnimate()) return
    const closedInset = (rad: string) =>
      direction === "up" ? `inset(100% 0 0 0 round ${rad})` : `inset(0 0 100% 0 round ${rad})`

    if (immediate) {
      const rad = getComputedStyle(el).getPropertyValue("--frame-radius").trim() || "20px"
      const closed = closedInset(rad)
      const opened = `inset(0 0 0 0 round ${rad})`
      el.style.clipPath = closed
      el.style.willChange = "clip-path"
      let anim: Animation | undefined
      const off = whenReady(() => {
        anim = el.animate([{ clipPath: closed }, { clipPath: opened }], {
          duration: durationMs,
          delay: delayMs,
          easing: EASE_CLIP,
          fill: "both",
        })
        anim.onfinish = () => {
          el.style.clipPath = opened
          el.style.willChange = ""
          anim?.cancel()
        }
      })
      return () => {
        off()
        anim?.cancel()
        el.style.clipPath = ""
        el.style.willChange = ""
      }
    }

    const r = "var(--frame-radius)"
    el.style.clipPath = closedInset(r)
    let clearTimer = 0
    const open = (extra = 0) => {
      el.style.transition = `clip-path ${durationMs}ms ${EASE_CLIP} ${delayMs + extra}ms`
      el.style.willChange = "clip-path"
      void el.offsetWidth
      el.style.clipPath = `inset(0 0 0 0 round ${r})`
      clearTimer = window.setTimeout(
        () => {
          el.style.willChange = ""
        },
        durationMs + delayMs + extra + 80,
      )
    }
    const reset = () => {
      if (clearTimer) clearTimeout(clearTimer)
      el.style.clipPath = ""
      el.style.transition = ""
      el.style.willChange = ""
    }
    return wireReveal(el, open, reset, {
      group,
      index,
      duration: durationMs,
      fromBottomPct,
      lead,
    })
  }, [durationMs, fromBottomPct, immediate, delayMs, group, index, direction, lead])
  return ref
}

// CTA entrance: the button scales in, then its `data-cta-label` fades in once the scale settles.
export function useCtaEntrance<T extends HTMLElement>({
  delayMs = 0,
  scaleDurationMs = 460,
  textDurationMs = 260,
}: { delayMs?: number; scaleDurationMs?: number; textDurationMs?: number } = {}) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const btn = ref.current
    if (!btn || !shouldAnimate()) return
    const label = btn.querySelector<HTMLElement>("[data-cta-label]")
    btn.style.transformOrigin = "center"
    btn.style.transform = "scale(0.82)"
    btn.style.opacity = "0"
    btn.style.transition = `transform ${scaleDurationMs}ms ${EASE_REVEAL} ${delayMs}ms, opacity ${scaleDurationMs}ms ease ${delayMs}ms`
    if (label) {
      label.style.opacity = "0"
      label.style.transition = `opacity ${textDurationMs}ms ease ${delayMs + scaleDurationMs}ms`
    }
    const off = whenReady(() => {
      void btn.offsetWidth
      btn.style.transform = "scale(1)"
      btn.style.opacity = "1"
      if (label) label.style.opacity = "1"
    })
    return () => {
      off()
      btn.style.transform = ""
      btn.style.opacity = ""
      btn.style.transition = ""
      btn.style.transformOrigin = ""
      if (label) {
        label.style.opacity = ""
        label.style.transition = ""
      }
    }
  }, [delayMs, scaleDurationMs, textDurationMs])
  return ref
}
