"use client"

import { tieredBonusEnabled } from "@/lib/sale/bonus"
import { stateOverridesEnabled } from "@/lib/sale/overrides"
import { useSyncExternalStore } from "react"

// Runtime on/off switch for the tiered-bonus surfaces, defaulting ON. It only flips the DISPLAY for
// quick review - the feature still has to be available on the environment (tieredBonusEnabled()).
// State lives in localStorage and is shared across every bonus surface via a tiny external store
// (no provider needed). SSR sees ON so the bars render bonus by default with no flash.

const KEY = "gnot:bonus-on"
const listeners = new Set<() => void>()

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== "0"
  } catch {
    return true
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}

function setBonusOn(value: boolean): void {
  try {
    window.localStorage.setItem(KEY, value ? "1" : "0")
  } catch {}
  for (const cb of listeners) cb()
}

/** Whether the tiered-bonus display is toggled on. Defaults ON; server snapshot is ON. */
export function useBonusOn(): boolean {
  return useSyncExternalStore(subscribe, read, () => true)
}

/** Small floating on/off control. Rendered only where the dev/review tools are enabled (local dev +
 *  the staging branch deploy), never for production end-users, and only when the bonus feature is
 *  available on this environment. */
export function BonusToggle() {
  const on = useBonusOn()
  if (!stateOverridesEnabled() || !tieredBonusEnabled()) return null
  return (
    <button
      type="button"
      onClick={() => setBonusOn(!on)}
      aria-pressed={on}
      className="fixed bottom-4 left-4 z-[60] inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${on ? "bg-mint" : "bg-border"}`} />
      Bonus {on ? "on" : "off"}
    </button>
  )
}
