"use client"

import { signalAppReady, whenHeroMediaReady } from "@/lib/motion/app-ready"
import { shouldAnimate } from "@/lib/motion/should-animate"
import { useEffect, useState } from "react"

const TIMEOUT_MS = 3000

// SSR-rendered, opaque from first paint; dismissed on hero canplay or a 3s cap. Sets data-app-ready. Hidden on mobile via .loader-cover.
export function Loader() {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (!shouldAnimate()) {
      signalAppReady()
      setGone(true)
      return
    }
    const screen = document.querySelector(".screen")
    screen?.classList.add("is-loading")
    let done = false
    const dismiss = () => {
      if (done) return
      done = true
      screen?.classList.remove("is-loading")
      signalAppReady()
      setGone(true)
    }
    const offHero = whenHeroMediaReady(() => {
      const fonts = document.fonts?.ready ?? Promise.resolve()
      fonts.then(dismiss, dismiss)
    })
    const cap = window.setTimeout(dismiss, TIMEOUT_MS)
    return () => {
      offHero()
      clearTimeout(cap)
      screen?.classList.remove("is-loading")
    }
  }, [])

  if (gone) return null
  return <div aria-hidden className="loader-cover" />
}
