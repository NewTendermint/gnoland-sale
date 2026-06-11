"use client"

import { createContext, useContext, useEffect, useMemo, useRef } from "react"
import { shouldAnimate } from "./should-animate"

/**
 * Coordinated scroll reveal. A RevealGroup gives a stack (or row) of reveal
 * primitives ONE shared scroll trigger so they cascade in visual order, instead
 * of each firing at its own threshold (which let a lower paragraph finish before
 * the title above it). Members - useReveal / useFade / useCountUp / useDrawLine -
 * register a `reveal(delayMs)` callback plus their total `duration`; when the group
 * scrolls into view it reveals each in order.
 *
 * Two ordering modes:
 *  - Auto (text): ranked by DOM order, each start pushed late enough that it never
 *    FINISHES before the element above it (a long words-title is not overtaken by a
 *    shorter paragraph below) while keeping a light overlap. `staggerMs` is the
 *    minimum gap.
 *  - Explicit `index` (e.g. a stats row where a divider + figure share a slot):
 *    fixed `baseDelayMs + index * staggerMs`.
 *
 * Nesting flattens: a RevealGroup inside another is transparent, so its members
 * join the OUTER cascade (e.g. a SectionHeading inside a wider block). `inline`
 * groups render no box (a Fragment) and trigger off the topmost member, so they can
 * group siblings that are themselves grid items without disturbing the layout.
 * Touch / reduced-motion: no trigger is created; members render themselves as-is.
 */

export type RevealMember = {
  /** Reveal this element, offset by `delayMs` on top of any internal stagger. */
  reveal: (delayMs: number) => void
  /** Explicit cascade slot; when omitted the group ranks members by DOM order. */
  index?: number
  /** Total reveal time (ms) - lets the auto cascade keep finishes in order. */
  duration?: number
  /** The clip panel that leads a tile: it opens first, and the rest of the group's
   * content starts partway through its growth (see LEAD_OVERLAP). At most one. */
  lead?: boolean
  /** Decorative self-drawing element (hairline, icon stroke): rides the current
   * cascade position and runs on its own timeline - it neither waits for the member
   * above it nor pushes the ones below, so a row of dividers never stalls content. */
  decorative?: boolean
}

export type RevealGroupApi = {
  register: (el: Element, member: RevealMember) => () => void
}

export const RevealGroupContext = createContext<RevealGroupApi | null>(null)

/** Members read this to know whether they sit inside a coordinated group. */
export function useRevealGroup(): RevealGroupApi | null {
  return useContext(RevealGroupContext)
}

const byDomOrder = (a: Element, b: Element) =>
  (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 ? -1 : 1

/** When a group has a lead clip (a growing tile), its content starts this far into
 * the clip's growth (0.2 = at 20%), so the panel is already opening as the content
 * cascades in - one trigger, a real timeline, no per-element delay. */
const LEAD_OVERLAP = 0.2

/**
 * One-shot scroll trigger shared by every reveal primitive and the group itself:
 * fire `onHit` the first time `el` rises past `fromBottomPct`% from the viewport
 * bottom, then stop. The +9999px top margin makes the active zone one-way (a fast
 * scroll that would skip a thin band still triggers). Returns a disconnect fn.
 */
export function observeReveal(el: Element, fromBottomPct: number, onHit: () => void): () => void {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        onHit()
        io.disconnect()
      }
    },
    { rootMargin: `9999px 0px -${fromBottomPct}% 0px`, threshold: 0 },
  )
  io.observe(el)
  return () => io.disconnect()
}

/**
 * Run `fn` after TWO animation frames, returning a cancel fn. The first frame lets a
 * just-parked start state (opacity 0 / scaleX 0 / translateY) - and any <Entrance> gate
 * lifting - actually paint; the second frame fires `fn`, so an on-mount CSS transition
 * has a real "before" frame and animates instead of snapping (a single rAF is
 * unreliable, worse under dev Strict Mode). The cancel handles both frames, so an
 * unmount mid-schedule (Strict Mode double-mount) is safe.
 */
export function doubleRaf(fn: () => void): () => void {
  let inner = 0
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(fn)
  })
  return () => {
    cancelAnimationFrame(outer)
    cancelAnimationFrame(inner)
  }
}

/**
 * Wire one reveal primitive's trigger, the single branch every hook shared: run it
 * on mount (`immediate`), through its RevealGroup (in cascade order), or on its own
 * one-shot scroll observer. `reveal(extra)` plays the animation offset by the
 * group's cascade delay; `reset` restores inline styles on cleanup. Returns the
 * effect cleanup. Keeps the per-hook effect down to "park the start state, define
 * reveal/reset, hand them here".
 */
export function wireReveal(
  el: Element,
  reveal: (extra: number) => void,
  reset: () => void,
  o: {
    immediate?: boolean
    group: RevealGroupApi | null
    index?: number
    duration: number
    fromBottomPct: number
    decorative?: boolean
    lead?: boolean
  },
): () => void {
  if (o.immediate) {
    const cancel = doubleRaf(() => reveal(0))
    return () => {
      cancel()
      reset()
    }
  }
  if (o.group) {
    const unregister = o.group.register(el, {
      reveal,
      index: o.index,
      duration: o.duration,
      decorative: o.decorative,
      lead: o.lead,
    })
    return () => {
      unregister()
      reset()
    }
  }
  const stop = observeReveal(el, o.fromBottomPct, () => reveal(0))
  return () => {
    stop()
    reset()
  }
}

/**
 * Owns the single trigger + the member registry for one group. Returns the `ref`
 * to attach to the trigger element (boxed mode) and the `api` to provide. In
 * `inline` mode the ref is unused: the group triggers off whichever member is
 * highest in the DOM, so it needs no box of its own.
 */
export function useRevealGroupController({
  staggerMs,
  baseDelayMs,
  fromBottomPct,
  inline = false,
}: {
  staggerMs: number
  baseDelayMs: number
  fromBottomPct: number
  inline?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const members = useRef(new Map<Element, RevealMember>())
  const fired = useRef(false)
  // The cascade origin for non-lead content (= baseDelay + half the lead clip's
  // growth when a lead exists), kept so late registrants land on the same timeline.
  const contentBase = useRef(0)
  const inlineIo = useRef<IntersectionObserver | null>(null)
  const inlineTop = useRef<Element | null>(null)
  // Latest config in a ref so the stable callbacks below never read stale values.
  const cfg = useRef({ staggerMs, baseDelayMs, fromBottomPct, inline })
  cfg.current = { staggerMs, baseDelayMs, fromBottomPct, inline }

  const fire = useRef(() => {})
  fire.current = () => {
    if (fired.current) return
    fired.current = true
    const all = [...members.current.entries()]
    const base = cfg.current.baseDelayMs
    // A lead clip (the growing tile) opens first; the rest of the content starts
    // partway through its growth, so the panel is already opening as the content
    // cascades in. No lead -> content base is just baseDelayMs (unchanged).
    const leadEntry = all.find(([, m]) => m.lead)
    if (leadEntry) leadEntry[1].reveal(base)
    contentBase.current = base + (leadEntry ? (leadEntry[1].duration ?? 0) * LEAD_OVERLAP : 0)

    const rest = all.filter(([, m]) => !m.lead)
    // Explicit-index members (e.g. a stats row): fixed slot, simple stagger.
    for (const [, m] of rest) {
      if (m.index != null) m.reveal(contentBase.current + m.index * cfg.current.staggerMs)
    }
    // Auto members: cascade by DOM order, each start pushed late enough that it
    // never finishes before the one above it, but at least `staggerMs` after it.
    const auto = rest.filter(([, m]) => m.index == null).map(([e]) => e)
    auto.sort(byDomOrder)
    let prevStart = contentBase.current
    let prevDur = 0
    auto.forEach((e, i) => {
      const m = members.current.get(e)
      if (!m) return
      // Decorative members ride the running position and draw on their own timeline:
      // they don't gate the content (and aren't gated by it).
      if (m.decorative) {
        m.reveal(prevStart)
        return
      }
      const dur = m.duration ?? 0
      const start =
        i === 0
          ? contentBase.current
          : Math.max(prevStart + cfg.current.staggerMs, prevStart + prevDur - dur)
      m.reveal(start)
      prevStart = start
      prevDur = dur
    })
  }

  // Inline groups have no box, so they watch whichever member is highest in the
  // DOM; re-pick if an earlier one registers later (e.g. after SplitText).
  const refreshInlineTrigger = useRef(() => {})
  refreshInlineTrigger.current = () => {
    if (!cfg.current.inline || fired.current || !shouldAnimate()) return
    // Trigger off the topmost RENDERED member, skipping any that are display:none at
    // this breakpoint (e.g. a mobile-only title that is the DOM-first member but
    // hidden on desktop - observing it would never intersect, so the group'd never fire).
    const top = [...members.current.keys()]
      .filter((el) => el.getClientRects().length > 0)
      .sort(byDomOrder)[0]
    if (!top || inlineTop.current === top) return
    inlineIo.current?.disconnect()
    inlineTop.current = top
    inlineIo.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fire.current()
          inlineIo.current?.disconnect()
        }
      },
      { rootMargin: `9999px 0px -${cfg.current.fromBottomPct}% 0px`, threshold: 0 },
    )
    inlineIo.current.observe(top)
  }

  const api = useMemo<RevealGroupApi>(
    () => ({
      register(el, member) {
        members.current.set(el, member)
        if (fired.current) {
          // Late registrant (split finished after the group fired): reveal now, on
          // the same content timeline (the lead clip already opened on first fire).
          if (member.lead) {
            member.reveal(cfg.current.baseDelayMs)
          } else if (member.decorative) {
            member.reveal(contentBase.current)
          } else {
            const idx = member.index ?? members.current.size - 1
            member.reveal(contentBase.current + idx * cfg.current.staggerMs)
          }
        } else {
          refreshInlineTrigger.current()
        }
        return () => {
          members.current.delete(el)
        }
      },
    }),
    [],
  )

  // Boxed mode: observe the group's own element.
  useEffect(() => {
    if (inline) return
    const el = ref.current
    if (!el || !shouldAnimate()) return
    return observeReveal(el, fromBottomPct, () => fire.current())
  }, [inline, fromBottomPct])

  // Inline observer cleanup on unmount.
  useEffect(() => () => inlineIo.current?.disconnect(), [])

  return { ref, api }
}
