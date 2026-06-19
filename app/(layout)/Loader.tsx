"use client"

import { useEffect, useState } from "react"
import { signalAppReady, whenHeroMediaReady } from "../../lib/motion/app-ready"
import { shouldAnimate } from "../../lib/motion/should-animate"

const TIMEOUT_MS = 3000

// Full-screen cover shown on desktop while the hero (mainly its video) buffers. Rendered on the
// server so it is opaque from the first paint (no content flash), it freezes the page scroll,
// then is removed (no fade - the cover and the un-framed screen are the same colour, so the cut
// is invisible) the moment the hero video can play through, or after a hard 3s cap so a slow or
// failed load never traps the user. Removal flips data-app-ready, which fires the frame-grow +
// the held reveals. CSS hides it on non-desktop (see .loader-cover media query) where it signals
// ready immediately, so the page behaves as before.
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
