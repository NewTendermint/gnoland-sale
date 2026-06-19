"use client"

// Gate between the desktop loading cover (Loader.tsx) and the page-load reveal: every immediate
// reveal waits on whenReady (fired when the cover dismisses); the Loader waits on
// whenHeroMediaReady (hero video buffered). On non-desktop the Loader signals ready instantly,
// so reveals behave exactly as before.

let appReady = false
const readyWaiters = new Set<() => void>()

// Runs cb once the cover is gone (synchronously if already gone). Returns an unsubscribe so a
// component unmounting before ready drops its waiter.
export function whenReady(cb: () => void): () => void {
  if (appReady) {
    cb()
    return () => {}
  }
  readyWaiters.add(cb)
  return () => {
    readyWaiters.delete(cb)
  }
}

export function signalAppReady(): void {
  if (appReady) return
  appReady = true
  // Hook for the CSS frame-grow (globals.css html[data-app-ready]).
  document.documentElement.setAttribute("data-app-ready", "")
  for (const cb of [...readyWaiters]) cb()
  readyWaiters.clear()
}

let heroMediaReady = false
const heroWaiters = new Set<() => void>()

export function signalHeroMediaReady(): void {
  if (heroMediaReady) return
  heroMediaReady = true
  for (const cb of [...heroWaiters]) cb()
  heroWaiters.clear()
}

export function whenHeroMediaReady(cb: () => void): () => void {
  if (heroMediaReady) {
    cb()
    return () => {}
  }
  heroWaiters.add(cb)
  return () => {
    heroWaiters.delete(cb)
  }
}
