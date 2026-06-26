"use client"

import { SALE_ECONOMICS } from "@/lib/sale/economics"
import {
  TAB_ALERT_ICON,
  TAB_ALERT_TITLE,
  type TabAlertState,
  resolveTabAlertState,
} from "@/lib/sale/tab-alert"
import { useEffect, useRef, useState } from "react"
import { useSale } from "./SaleProvider"

const SALE_CLOSES_MS = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
const FAVICON_ID = "tab-alert-favicon"

// Headless: reflects the bid's re-engagement state in document.title + the favicon (a pre-baked
// badged variant of the gno.land mark). Mounted home-only, inside SaleProvider. No network beyond
// the static icon, no storage.
export function TabAlert() {
  const { journey, phase } = useSale()
  const [state, setState] = useState<TabAlertState>(null)
  const originalTitle = useRef<string | null>(null)
  const desiredTitle = useRef<string | null>(null)
  const desiredIcon = useRef<string | null>(null)
  const enforceIcon = useRef<(() => void) | null>(null)

  useEffect(() => {
    const evaluate = () =>
      setState(
        resolveTabAlertState({ journey, phase, saleClosesMs: SALE_CLOSES_MS, nowMs: Date.now() }),
      )
    evaluate()
    // closing-soon is time-driven; tick only while live so it flips on its own.
    if (phase !== "live") return
    const id = setInterval(evaluate, 60_000)
    return () => clearInterval(id)
  }, [journey, phase])

  // Pin document.title + restore on unmount: Next re-asserts the metadata <title> during
  // hydration, which would clobber a one-shot write (e.g. when already outbid on load).
  useEffect(() => {
    const titleEl = document.querySelector("title")
    const obs = new MutationObserver(() => {
      const want = desiredTitle.current
      if (want !== null && document.title !== want) document.title = want
    })
    if (titleEl) obs.observe(titleEl, { childList: true, characterData: true, subtree: true })
    return () => {
      obs.disconnect()
      if (originalTitle.current !== null) document.title = originalTitle.current
    }
  }, [])

  // Own the tab icon. Next ships several <link rel=icon> (favicon.ico, icon.svg) and re-commits
  // them ~after hydration, so a one-shot strip loses; an observer re-enforces. We become the sole
  // icon link (the badge must win precedence); the original icon href is reused as the no-alert base.
  useEffect(() => {
    let baseHref: string | null = null
    const saved: HTMLLinkElement[] = []
    const enforce = () => {
      const others = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')].filter(
        (l) => l.id !== FAVICON_ID,
      )
      if (others.length) {
        if (!saved.length) {
          for (const l of others) saved.push(l.cloneNode(true) as HTMLLinkElement)
          baseHref = (others.find((l) => l.href.includes(".svg")) ?? others[0])?.href ?? null
        }
        for (const l of others) l.remove()
      }
      const want = desiredIcon.current ?? baseHref
      if (!want) return
      const wantAbs = new URL(want, location.href).href
      const mine = document.getElementById(FAVICON_ID) as HTMLLinkElement | null
      if (mine && mine.href === wantAbs) return // already correct: skip, or the observer loops
      mine?.remove()
      const link = document.createElement("link")
      link.id = FAVICON_ID
      link.rel = "icon"
      link.href = want
      document.head.appendChild(link)
    }
    enforceIcon.current = enforce
    enforce()
    const obs = new MutationObserver(enforce)
    obs.observe(document.head, { childList: true })
    return () => {
      obs.disconnect()
      document.getElementById(FAVICON_ID)?.remove()
      for (const l of saved) document.head.appendChild(l.cloneNode(true))
    }
  }, [])

  useEffect(() => {
    if (originalTitle.current === null) originalTitle.current = document.title
    desiredTitle.current = state ? TAB_ALERT_TITLE[state] : originalTitle.current
    document.title = desiredTitle.current
    desiredIcon.current = state ? TAB_ALERT_ICON[state] : null
    enforceIcon.current?.()
  }, [state])

  return null
}
