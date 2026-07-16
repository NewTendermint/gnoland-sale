"use client"

import { firstDayBonusClosesIso, firstDayBonusEnabled, isWithinBonusWindow } from "@/lib/sale/bonus"
import { SALE_ECONOMICS } from "@/lib/sale/economics"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Countdown } from "../../(layout)/Countdown"
import { Icon } from "../../(ui)/Icon"

// Promo surfaces for the first-24h bonus. Display-only: nothing here reads or writes sale state, it
// only shows marketing copy + a countdown. Gated by firstDayBonusEnabled() so it stays off unless
// explicitly turned on. `force` pins a surface on for the dev-states gallery (bypasses both the flag
// and the window), so it never leaks into production, only the gallery passes it.

const PCT = SALE_ECONOMICS.firstDayBonusPct

// Client-only window check: false on the first render (matching SSR) and resolved after mount, so a
// boundary crossing can never trigger a hydration mismatch. `force` pins it true. The tick stops
// itself once the window has closed for good (it can never reopen), so it never lingers for the rest
// of the sale.
function useBonusWindowActive(enabled: boolean, force?: boolean): boolean {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (force) {
      setActive(true)
      return
    }
    if (!enabled) return
    setActive(isWithinBonusWindow(Date.now()))
    const closeMs = new Date(firstDayBonusClosesIso).getTime()
    // Already closed: settle to false and never start a ticker (the window cannot reopen).
    if (Date.now() >= closeMs) return
    const interval = setInterval(() => setActive(isWithinBonusWindow(Date.now())), 1000)
    // Stop ticking exactly at close, so the timer never lingers for the rest of the sale.
    const stopAt = setTimeout(() => {
      clearInterval(interval)
      setActive(false)
    }, closeMs - Date.now())
    return () => {
      clearInterval(interval)
      clearTimeout(stopAt)
    }
  }, [enabled, force])
  return active
}

/** Live-bar promo banner with a countdown to the window close. Renders only while the bonus is
 *  enabled AND the current time is inside the first-24h window (or when forced); otherwise nothing. */
export function FirstDayBonusBanner({ force }: { force?: boolean }) {
  const t = useTranslations("BidPanel")
  const enabled = firstDayBonusEnabled()
  const active = useBonusWindowActive(enabled, force)
  if (!enabled && !force) return null
  if (!active) return null
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-mint/40 bg-mint/10 px-3 py-1.5 text-xs">
      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
        <Icon name="cube" draw={false} className="h-4 w-4 shrink-0 text-mint" />
        {t("bonusBannerTitle")}
      </span>
      <span className="text-muted">{t("bonusBannerBody", { pct: PCT })}</span>
      <span className="ml-auto inline-flex items-center gap-2 font-mono tabular-nums text-foreground">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
          {t("bonusEndsIn")}
        </span>
        <Countdown targetIso={firstDayBonusClosesIso} label={t("bonusEndsIn")} />
      </span>
    </div>
  )
}

/** Inline promo note.
 *  - "confirm": shown in the bid confirm step, gated to the live 24h window.
 *  - "settlement": shown to winners after the sale (window is over), so it is flag-gated only and
 *    worded conditionally since eligibility is settled off-app. */
export function FirstDayBonusNote({
  context,
  force,
}: { context: "confirm" | "settlement"; force?: boolean }) {
  const t = useTranslations("Bid")
  const enabled = firstDayBonusEnabled()
  const windowActive = useBonusWindowActive(enabled, force)
  if (!enabled && !force) return null
  if (context === "confirm" && !windowActive) return null
  return (
    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
      <Icon name="cube" draw={false} className="h-3.5 w-3.5 shrink-0 text-mint" />
      {context === "confirm"
        ? t("bonusConfirmNote", { pct: PCT })
        : t("bonusSettlementNote", { pct: PCT })}
    </p>
  )
}
