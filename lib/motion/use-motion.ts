"use client"

import { useContext, useEffect, useRef } from "react"
import { loadEngine } from "./engine"
import { RevealGroupContext, doubleRaf, observeReveal, wireReveal } from "./reveal-group"
import { shouldAnimate } from "./should-animate"

/** Shared easings. One source so every reveal of the same genre moves identically.
 * `EASE_REVEAL` (easeOutExpo-ish): text/line/fade reveals. `EASE_CLIP` (easeOutQuint):
 * the slower clip-open boxes (images + tiles), a softer, more even landing. */
const EASE_REVEAL = "cubic-bezier(0.16, 1, 0.3, 1)"
const EASE_CLIP = "cubic-bezier(0.22, 1, 0.36, 1)"

type MotionConfig = {
  type: "parallax"
  /** Total vertical travel in px across the element's transit. */
  distance?: number
  /** Scrub smoothing in seconds (the value-lerp). 0 = locked to scroll. */
  lerp?: number
}

/**
 * Declarative scroll motion. Returns two refs: `triggerRef` (the stable,
 * untransformed element that defines WHEN the motion runs - the whole time it
 * crosses the viewport) and `targetRef` (the element that actually moves).
 * Keeping them separate is what makes the parallax run the full transit: if the
 * animated element were also the trigger, its own transform would shift the
 * trigger bounds and the motion would finish early.
 *
 * Engine = GSAP ScrollTrigger (`.screen` scroller, `scrub` = value-lerp),
 * encapsulated and swappable. Native scroll only, lazy-loaded, desktop-only.
 */
export function useMotion<T extends HTMLElement>({
  type,
  distance = 320,
  lerp = 0.6,
}: MotionConfig) {
  const triggerRef = useRef<T>(null)
  const targetRef = useRef<T>(null)
  useEffect(() => {
    const trigger = triggerRef.current
    const target = targetRef.current
    if (!trigger || !target || !shouldAnimate()) return
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
              // Extend the range by the overshoot (distance/2) on each end so the
              // parallax runs the whole time the MOVING element is visible, not
              // just while the trigger slot is - otherwise it freezes early.
              start: `top bottom+=${distance / 2}`,
              end: `bottom top-=${distance / 2}`,
              scrub: lerp,
            },
          },
        )
        cleanup = () => {
          tween.scrollTrigger?.kill()
          tween.kill()
        }
      }
    })
    return () => {
      killed = true
      cleanup?.()
    }
  }, [type, distance, lerp])
  return { triggerRef, targetRef }
}

/**
 * One-shot "draw" reveal for a horizontal line. Returns a ref for a full-width
 * WRAPPER; its single child is the line that actually draws (clipped open
 * left-to-right via clip-path + a CSS transition).
 *
 * Why observe the wrapper and not the line itself: IntersectionObserver keys on
 * the element's INTERSECTION AREA, and a line we collapse to draw it (clip-path
 * `inset(0 100% 0 0)`, or a `scaleX(0)`) has a ZERO-area box - so the IO never
 * reports it intersecting and the draw never fires (verified live: a clipped
 * line read `intersecting=false` even when geometrically inside the root). The
 * wrapper keeps its full box, so the IO always has real area to intersect.
 *
 * The draw is a `transform: scaleX(0 -> 1)` (origin left) on a CSS transition,
 * NOT clip-path and NOT a GSAP tween. transform is compositor-accelerated - no
 * per-frame repaint, unlike a clip-path animation (which repaints every frame,
 * notably on Firefox) - so the draw is cheap and stays fan-free. A CSS
 * transition is browser-driven, completing on its own with ZERO rAF even when
 * GSAP's ticker sleeps (a GSAP duration-tween would freeze mid-draw once that
 * ticker idles). For a solid 1px hairline scaleX is visually identical to a
 * left-to-right wipe.
 *
 * Trigger: the line draws when it rises to `fromBottomPct`% from the BOTTOM of
 * the viewport. rootMargin bottom `-fromBottomPct%` pulls the root's bottom edge
 * up to that line; the top `+9999px` makes the active zone "everything at or
 * above that line" (one-way) so even a fast scroll that would skip a thin band
 * still triggers the draw. Touch / reduced-motion: shown full, no animation.
 */
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
  /** Cascade slot when inside a RevealGroup (omit to rank by DOM order). */
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
    // `extra` is the group's cascade offset (0 outside a group).
    const draw = (extra = 0) => {
      // Re-park (scaleX 0) transition-free, commit it with a reflow, then enable the
      // transition and draw - so the on-mount draw fires reliably instead of snapping.
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
    // A hairline is decorative: in a group it rides the cascade and draws on its own
    // timeline, so a column of dividers never stalls the content rows between them.
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

/**
 * Element-level "mask rise": the same masked slide-up as the text Reveal, but for a
 * WHOLE element (e.g. a table row) instead of split text lines. The ref goes on a
 * full-box wrapper that clips its overflow; its single child is parked at
 * translateY(110%) (fully below the mask) then slides to 0 on a CSS transition when
 * scrolled in - browser-driven, ZERO rAF, idle GPU 0. Deliberately lighter than
 * running SplitText on every list row (see useReveal's note): a transform on one box
 * per row, not a per-line split. Inside a RevealGroup it joins the cascade like any
 * other member. Touch / reduced-motion: shown in place, no animation.
 */
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
  /** Cascade slot when inside a RevealGroup (omit to rank by DOM order). */
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
    // `extra` is the group's cascade offset (0 outside a group).
    const reveal = (extra = 0) => {
      inner.style.transition = `transform ${durationMs}ms ${EASE_REVEAL} ${delayMs + extra}ms`
      void inner.offsetWidth // commit the parked state as the transition start
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

/**
 * Cuberto-style text reveal: split the element into rendered LINES (each masked
 * by overflow-clip), then slide every line up from below its mask with a stagger.
 *
 * SPLITTING is GSAP SplitText (free + public since 3.13, bundled in our pinned
 * 3.15) - far more robust than letter-wrapping libs (charming): it splits by
 * ACTUAL rendered lines, `autoSplit` re-splits on resize / font-load (charming
 * breaks on reflow), and `aria: "auto"` keeps the original text in the
 * accessibility tree (a screen reader never reads "G-N-O-T").
 *
 * The ANIMATION is a CSS transition on `transform: translateY` (per-line
 * transition-delay = the stagger), triggered by an IntersectionObserver - NOT a
 * GSAP tween + ScrollTrigger. Two reasons:
 *  - Perf: a CSS transition is browser-driven and needs ZERO rAF, so the GPU
 *    idles at 0 once it finishes (no fans, even Firefox/Linux), and an IO costs
 *    nothing between hits - whereas 20+ ScrollTriggers do work on every scroll.
 *  - Correctness: ScrollTrigger `from()` tweens were firing at LOAD here (created
 *    before layout settled, so their start positions were wrong) and revealing
 *    everything at once. The IO keys on the element's box, which always has area,
 *    so it fires only when actually scrolled to.
 *
 * Trigger zone = `fromBottomPct`% from the bottom; rootMargin top `+9999px` makes
 * it one-way (robust to fast scrolls). `immediate`: reveal on mount (hero), with
 * a visibility guard against a flash while the engine lazy-loads. Touch /
 * reduced-motion: shown as-is, no split, no animation.
 */
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
  /** Cascade slot when inside a RevealGroup (omit to rank by DOM order). */
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
    if (immediate) el.style.visibility = "hidden"
    loadEngine()
      .then(({ SplitText }) => {
        if (killed || !ref.current) return
        split = SplitText.create(el, {
          type: type,
          mask: type,
          // Re-split (and re-run onSplit) when the text re-wraps or fonts load.
          autoSplit: true,
          aria: "auto",
          linesClass: "reveal-line",
          wordsClass: "reveal-word",
          onSplit: (self) => {
            const units = (type === "words" ? self.words : self.lines) as HTMLElement[]
            for (const line of units) line.style.transform = "translateY(110%)"
            // `extra` is the group's cascade offset (0 outside a group); it shifts
            // the whole line stagger so this block reveals after the ones above it.
            const reveal = (extra = 0) => {
              units.forEach((line, i) => {
                line.style.transition = `transform ${durationMs}ms ${EASE_REVEAL} ${delayMs + extra + i * staggerMs}ms`
              })
              void el.offsetWidth // commit the hidden state as the transition start
              for (const line of units) line.style.transform = "translateY(0)"
            }
            // Lines are now hidden in their masks - safe to show the container, then
            // wire the trigger (re-wired here on each autoSplit re-run). The member
            // duration includes the per-line stagger so the group orders finishes.
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
        // Never leave the text invisible if the engine fails to load.
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

/**
 * Block "appear" stagger for a grid / list: when the container scrolls into
 * view, its direct children fade + rise in, one after another.
 *
 * Pure IntersectionObserver + CSS transitions (opacity + transform) - no GSAP,
 * no SplitText, so nothing to lazy-load and ZERO rAF: browser-driven, GPU idles
 * at 0 once done (no fans, even Firefox/Linux). Far lighter than splitting every
 * card's text line-by-line. opacity + transform are the two compositor-only
 * properties, so the cascade never triggers paint. The top `+9999px` rootMargin
 * makes the trigger one-way (a fast scroll can't skip it). Touch / reduced-motion:
 * shown as-is, no animation.
 */
export function useStagger<T extends HTMLElement>({
  staggerMs = 70,
  durationMs = 600,
  yPx = 24,
  fromBottomPct = 20,
  delayMs = 0,
  immediate = false,
}: {
  staggerMs?: number
  durationMs?: number
  yPx?: number
  fromBottomPct?: number
  delayMs?: number
  immediate?: boolean
} = {}) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const container = ref.current
    if (!container || !shouldAnimate()) return
    const items = Array.from(container.children) as HTMLElement[]
    if (!items.length) return
    // Park the painted start state (the transition itself is (re)applied in show()).
    for (const item of items) {
      item.style.opacity = "0"
      item.style.transform = `translateY(${yPx}px)`
    }
    const show = () => {
      // Re-park as a transition-FREE baseline, force a reflow to commit it, then enable
      // the transition and flip to the end value. Doing the baseline commit explicitly
      // (not relying on a prior paint) makes on-mount / Entrance-gated reveals fire
      // every time instead of snapping intermittently.
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
    // `immediate`: cascade on mount (an always-visible row like the sticky bar, or the
    // hero gated by <Entrance>). doubleRaf defers past the parked-state paint + gate
    // lift so the transition animates instead of snapping (see its doc).
    if (immediate) {
      const cancel = doubleRaf(show)
      return () => {
        cancel()
        reset()
      }
    }
    const stop = observeReveal(container, fromBottomPct, show)
    return () => {
      stop()
      reset()
    }
  }, [staggerMs, durationMs, yPx, fromBottomPct, delayMs, immediate])
  return ref
}

/**
 * Single-element "fade in" (opacity + a small rise) when it scrolls into view.
 * IntersectionObserver + a CSS transition - browser-driven, zero rAF, idle GPU 0
 * (no fans). For content that should appear calmly without the line-by-line
 * reveal (e.g. team members, the TokenDetails blocks). Touch / reduced-motion:
 * shown as-is.
 */
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
  /** Extra delay before the fade (for sequencing a group). */
  delayMs?: number
  /** Fade on mount instead of on scroll (for always-visible elements). */
  immediate?: boolean
  /** Cascade slot when inside a RevealGroup (omit to rank by DOM order). */
  index?: number
} = {}) {
  const group = useContext(RevealGroupContext)
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !shouldAnimate()) return
    el.style.opacity = "0"
    el.style.transform = `translateY(${yPx}px)`
    // `extra` is the group's cascade offset (0 outside a group).
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

/**
 * Count-up for a key figure (matches the newtendermint.org stats): on scroll-in,
 * the number tweens 0 -> target with a cubic ease-out. `value` carries the final
 * string ("150+", "1,337", "$2M"...) - the numeric run is animated, any prefix /
 * suffix (sign, "+", "M", commas) is preserved. One-shot rAF that stops on
 * completion, so the GPU/CPU idle at 0 afterwards (no fans). Touch /
 * reduced-motion: the final value is left as server-rendered, no animation.
 */
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
    if (!match || !shouldAnimate()) return // non-numeric or reduced-motion: leave as-is
    const prefix = match[1]
    const target = Number.parseInt(match[2].replace(/,/g, ""), 10)
    const suffix = match[3]
    el.textContent = `${prefix}0${suffix}`
    el.style.opacity = "0" // transparent at the start; fades in with the count
    let raf = 0
    let timer = 0
    let killed = false
    // `extra` is the group's cascade offset (0 outside a group): wait it out, then count.
    const run = (extra = 0) => {
      // Fade the figure in (opacity 0 -> 1) in sync with the count start, so it
      // materialises rather than showing a static "0" first.
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

/**
 * Self-drawing stroke icon (like newtendermint.org): each stroke shape in the
 * SVG is hidden via stroke-dasharray/dashoffset, then drawn (dashoffset -> 0) on
 * a CSS transition when scrolled into view. Returns a ref for the <svg>. The
 * icons here are stroke-only (fill:none, stroke:currentColor), so every
 * path/line/circle/rect can be measured with getTotalLength() and drawn.
 *
 * `immediate`: draw on mount (for always-visible icons). One-shot - the offset
 * transition completes then nothing runs (idle 0). A stroke-dashoffset tween
 * does repaint, but the icon is tiny and it animates once. Touch /
 * reduced-motion: shown drawn, no animation.
 */
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
  /** Cascade slot when inside a RevealGroup (omit to rank by DOM order). */
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
    // `extra` is the group's cascade offset (0 outside a group).
    const draw = (extra = 0) => {
      void svg.getBoundingClientRect() // commit the hidden state as the start
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
    // Decorative: the (long) self-draw rides the cascade and runs on its own
    // timeline, so it never gates the text cluster around it. duration 0 so the
    // member that follows it starts at the normal stagger, not after the draw.
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

/**
 * "Window opens" reveal for an image/scene box: clip-path expands the box from
 * the bottom edge upward, keeping the rounded corners (`round var(--frame-radius)`).
 * Scroll path: IntersectionObserver + a CSS transition (one-shot). `immediate`
 * (above-the-fold, e.g. the hero): the Web Animations API, because an on-mount CSS
 * transition has no painted closed frame to animate from and would snap straight
 * open. Touch / reduced-motion: shown open, no animation.
 */
export function useClipOpen<T extends HTMLElement>({
  durationMs = 1500,
  // Images + tiles trigger higher than the text/line/fade reveals (40% vs the shared
  // 20%): the box is invisible until it opens, so firing earlier keeps the
  // reserved-but-empty gap short instead of leaving a blank box low on screen.
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
  /** Cascade slot when inside a RevealGroup (omit to rank by DOM order). */
  index?: number
  /** Wipe direction: "up" = from the bottom edge upward (the hero intro), "down" =
   * from the top edge downward (default for section images). */
  direction?: "up" | "down"
  /** Lead the group as a growing panel: open first, then the group's content starts
   * halfway through this growth (a tile timeline). Only meaningful inside a group. */
  lead?: boolean
} = {}) {
  const group = useContext(RevealGroupContext)
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !shouldAnimate()) return
    // Closed state collapses to the edge the wipe grows FROM: "up" keeps the bottom
    // edge (top inset 100%), "down" keeps the top edge (bottom inset 100%).
    const closedInset = (rad: string) =>
      direction === "up" ? `inset(100% 0 0 0 round ${rad})` : `inset(0 0 100% 0 round ${rad})`

    // `immediate`: above-the-fold boxes (the hero scene). Unlike the scroll path
    // below, the box never sits closed for a painted frame before it opens, so a
    // CSS transition fired by a forced reflow has no painted "before" state to
    // animate from - it SNAPS straight open (and dev Strict Mode, which re-runs
    // the effect, makes that worse). Drive the wipe with the Web Animations API
    // instead: it animates explicitly between keyframes regardless of the
    // before-change style, so the open always plays on mount. The radius is
    // resolved to px for the keyframes (portable; at `inset(0)` the rounding is
    // moot, and the box keeps its own --frame-radius corners via overflow-hidden).
    // One-shot: on finish we pin the open state and drop the animation, so the GPU
    // idles at 0. In a background tab the timeline is paused, so it just plays the
    // wipe once the tab is shown instead of snapping.
    if (immediate) {
      const rad = getComputedStyle(el).getPropertyValue("--frame-radius").trim() || "20px"
      const closed = closedInset(rad)
      const opened = `inset(0 0 0 0 round ${rad})`
      el.style.clipPath = closed
      el.style.willChange = "clip-path"
      const anim = el.animate([{ clipPath: closed }, { clipPath: opened }], {
        duration: durationMs,
        delay: delayMs,
        easing: EASE_CLIP,
        fill: "both",
      })
      anim.onfinish = () => {
        el.style.clipPath = opened // pin before dropping the fill so it can't snap back
        el.style.willChange = ""
        anim.cancel()
      }
      return () => {
        anim.cancel()
        el.style.clipPath = ""
        el.style.willChange = ""
      }
    }

    // Scroll / grouped path: the box sits closed (and painted) until triggered,
    // giving the CSS transition a real before-change baseline so it wipes reliably.
    // Rounded corners track --frame-radius live via the var.
    const r = "var(--frame-radius)"
    el.style.clipPath = closedInset(r)
    let clearTimer = 0
    // `extra` is the group's cascade offset (0 outside a group). Hint the layer
    // only for the open, then drop it (a permanent will-change wastes memory).
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

/**
 * CTA page-load entrance: the button scales in (a soft pop), and only once the
 * scale has settled does its inner label (the element marked `data-cta-label`)
 * fade in - "the pill appears, then the text inside it". Two coordinated CSS
 * transitions, browser-driven (zero rAF, idle GPU 0). `delayMs` places it at the
 * end of the coordinated entrance cascade. Touch / reduced-motion: shown as-is.
 */
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
      // the label waits out the scale, then fades in
      label.style.transition = `opacity ${textDurationMs}ms ease ${delayMs + scaleDurationMs}ms`
    }
    void btn.offsetWidth // commit the start state as the transition origin
    btn.style.transform = "scale(1)"
    btn.style.opacity = "1"
    if (label) label.style.opacity = "1"
    return () => {
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
