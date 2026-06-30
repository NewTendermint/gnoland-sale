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

// Headless: overlays document.title + a badge favicon for re-engagement (outbid / sale closing).
// FOOTGUN: never remove Next's own <title> / <link rel=icon> nodes - detaching React-owned DOM
// crashes the reconciler (removeChild on null). We only set document.title + append our OWN <link>.
export function TabAlert() {
  const { journey, phase } = useSale()
  const [state, setState] = useState<TabAlertState>(null)
  const originalTitle = useRef<string | null>(null)
  const desiredTitle = useRef<string | null>(null)

  useEffect(() => {
    const evaluate = () =>
      setState(
        resolveTabAlertState({ journey, phase, saleClosesMs: SALE_CLOSES_MS, nowMs: Date.now() }),
      )
    evaluate()
    if (phase !== "live") return
    const id = setInterval(evaluate, 60_000)
    return () => clearInterval(id)
  }, [journey, phase])

  // Our badge <link>, kept last so the browser prefers it; an observer re-asserts it after Next's
  // post-hydration <head> commit. Guarded against loops; never touches Next's nodes.
  useEffect(() => {
    if (!state) {
      document.getElementById(FAVICON_ID)?.remove()
      return
    }
    const icon = TAB_ALERT_ICON[state]
    const enforce = () => {
      const iconLinks = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')]
      const mine = document.getElementById(FAVICON_ID) as HTMLLinkElement | null
      const isLast = iconLinks.length > 0 && iconLinks[iconLinks.length - 1] === mine
      if (mine && mine.getAttribute("href") === icon && isLast) return
      mine?.remove()
      const link = document.createElement("link")
      link.id = FAVICON_ID
      link.rel = "icon"
      link.setAttribute("href", icon)
      document.head.appendChild(link)
    }
    enforce()
    const obs = new MutationObserver(enforce)
    obs.observe(document.head, { childList: true })
    return () => {
      obs.disconnect()
      document.getElementById(FAVICON_ID)?.remove()
    }
  }, [state])

  // Observer re-applies our title override (Next re-asserts its metadata <title> after hydration).
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

  useEffect(() => {
    if (state) {
      // Capture lazily on first override: the real metadata title is set after hydration, not "".
      if (originalTitle.current === null) originalTitle.current = document.title
      desiredTitle.current = TAB_ALERT_TITLE[state]
      document.title = desiredTitle.current
    } else {
      desiredTitle.current = null
      if (originalTitle.current !== null) document.title = originalTitle.current
    }
  }, [state])

  return null
}
