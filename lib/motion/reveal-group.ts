"use client"

import { createContext, useContext, useEffect, useMemo, useRef } from "react"
import { whenReady } from "./app-ready"
import { shouldAnimate } from "./should-animate"

// Coordinated scroll reveal: members share one trigger and cascade in visual order.

export type RevealMember = {
  reveal: (delayMs: number) => void
  /** Explicit cascade slot; when omitted the group ranks members by DOM order. */
  index?: number
  /** Total reveal time (ms), used to keep the auto cascade finish-ordered. */
  duration?: number
  /** Clip panel that leads a tile: opens first, content starts partway through. At most one. */
  lead?: boolean
  /** Self-drawing element that rides the cascade on its own timeline, gating nothing. */
  decorative?: boolean
}

export type RevealGroupApi = {
  register: (el: Element, member: RevealMember) => () => void
}

export const RevealGroupContext = createContext<RevealGroupApi | null>(null)

export function useRevealGroup(): RevealGroupApi | null {
  return useContext(RevealGroupContext)
}

const byDomOrder = (a: Element, b: Element) =>
  (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 ? -1 : 1

const LEAD_OVERLAP = 0.2

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

// Run `fn` after two animation frames, returning a cancel fn.
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

// Wire one reveal primitive's trigger: immediate, grouped, or own scroll observer. Returns cleanup.
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
    let cancel = () => {}
    const off = whenReady(() => {
      cancel = doubleRaf(() => reveal(0))
    })
    return () => {
      off()
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
  const contentBase = useRef(0)
  const inlineIo = useRef<IntersectionObserver | null>(null)
  const inlineTop = useRef<Element | null>(null)
  const cfg = useRef({ staggerMs, baseDelayMs, fromBottomPct, inline })
  cfg.current = { staggerMs, baseDelayMs, fromBottomPct, inline }

  const fire = useRef(() => {})
  fire.current = () => {
    if (fired.current) return
    fired.current = true
    const all = [...members.current.entries()]
    const base = cfg.current.baseDelayMs
    const leadEntry = all.find(([, m]) => m.lead)
    if (leadEntry) leadEntry[1].reveal(base)
    contentBase.current = base + (leadEntry ? (leadEntry[1].duration ?? 0) * LEAD_OVERLAP : 0)

    const rest = all.filter(([, m]) => !m.lead)
    for (const [, m] of rest) {
      if (m.index != null) m.reveal(contentBase.current + m.index * cfg.current.staggerMs)
    }
    const auto = rest.filter(([, m]) => m.index == null).map(([e]) => e)
    auto.sort(byDomOrder)
    let prevStart = contentBase.current
    let prevDur = 0
    auto.forEach((e, i) => {
      const m = members.current.get(e)
      if (!m) return
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

  const refreshInlineTrigger = useRef(() => {})
  refreshInlineTrigger.current = () => {
    if (!cfg.current.inline || fired.current || !shouldAnimate()) return
    // Trigger off the topmost rendered member, skipping any display:none at this breakpoint.
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

  useEffect(() => {
    if (inline) return
    const el = ref.current
    if (!el || !shouldAnimate()) return
    return observeReveal(el, fromBottomPct, () => fire.current())
  }, [inline, fromBottomPct])

  useEffect(() => () => inlineIo.current?.disconnect(), [])

  return { ref, api }
}
