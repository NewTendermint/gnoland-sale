"use client"

// Ready gate: reveals wait on whenReady (cover dismissed); the Loader waits on whenHeroMediaReady
// (hero video buffered).

let appReady = false
const readyWaiters = new Set<() => void>()

// Runs cb once the cover is gone (synchronously if already); returns an unsubscribe.
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
