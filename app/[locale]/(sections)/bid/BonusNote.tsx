"use client"

import { firstDayBonusClosesIso, firstDayBonusEnabled, isWithinBonusWindow } from "@/lib/sale/bonus"
import { SALE_ECONOMICS } from "@/lib/sale/economics"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Countdown } from "../../(layout)/Countdown"
import { FadeIn } from "../../(ui)/FadeIn"
import { Icon } from "../../(ui)/Icon"

// Promo surfaces for the first-24h bonus. Display-only: nothing here reads or writes sale state, it
// only shows marketing copy + a countdown. Gated by firstDayBonusEnabled() so it stays off unless
// explicitly turned on. `force` pins a surface on for the dev-states gallery (bypasses both the flag
// and the window), so it never leaks into production, only the gallery passes it.

const PCT = SALE_ECONOMICS.firstDayBonusPct

// Editorial highlight tag, same idiom as the "winning" badge in FunnelSteps: solid mint, bold
// uppercase, mono tracking. The only accent surface the design uses for a positive highlight.
const BONUS_TAG =
  "shrink-0 rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-mint"

// True only inside the first-24h window (never before the sale opens, never after). Client-only:
// false on the first render (renders nothing on SSR, so no hydration mismatch), resolved after
// mount. A single timeout flips it at the next boundary (wait-for-open, then hide-at-close) - the
// visible Countdown does its own per-second ticking, so no interval is needed. `force` pins it true.
function useBonusWindowActive(force?: boolean): boolean {
  const [active, setActive] = useState(false)
  useEffect(() => {
    if (force) {
      setActive(true)
      return
    }
    const openMs = new Date(SALE_ECONOMICS.saleOpensIso).getTime()
    const closeMs = new Date(firstDayBonusClosesIso).getTime()
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = () => {
      const now = Date.now()
      setActive(isWithinBonusWindow(now))
      if (now < openMs) timer = setTimeout(tick, openMs - now)
      else if (now < closeMs) timer = setTimeout(tick, closeMs - now)
    }
    tick()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [force])
  return active
}

/** Compact promo pill (solid-mint "winning" badge idiom). Renders only while the bonus is enabled
 *  AND the clock is inside the first-24h window (or forced). `className` lets a caller place it
 *  inline (e.g. after the confirm-step delta line). */
export function FirstDayBonusPill({
  force,
  className = "",
}: { force?: boolean; className?: string }) {
  const t = useTranslations("BidPanel")
  const active = useBonusWindowActive(force)
  if (!firstDayBonusEnabled() && !force) return null
  if (!active) return null
  return <span className={`${BONUS_TAG} ${className}`}>{t("bonusPill", { pct: PCT })}</span>
}

/** Live-bar promo banner: a continuously scrolling ticker of the promo, with the window countdown
 *  pinned on the right. Renders only while the bonus is enabled AND the clock is inside the
 *  first-24h window (or forced); nothing before or after. The ticker is decorative (aria-hidden)
 *  with an sr-only text equivalent, and holds still under reduced motion. */
export function FirstDayBonusBanner({ force }: { force?: boolean }) {
  const t = useTranslations("BidPanel")
  const active = useBonusWindowActive(force)
  if (!firstDayBonusEnabled() && !force) return null
  if (!active) return null
  const title = t("bonusBannerTitle")
  const body = t("bonusBannerBody", { pct: PCT })
  return (
    // Fades in at the tail of the bar's load entrance (after the metrics + CTA), matching the
    // site's FadeIn idiom. `immediate` reveals on mount without waiting for scroll; opacity-only so
    // the reserved space never shifts the metrics below.
    <FadeIn
      as="div"
      immediate
      delayMs={1500}
      className="mb-3 flex items-center gap-10 overflow-hidden py-1 text-xs"
    >
      <span className={BONUS_TAG}>{t("bonusPill", { pct: PCT })}</span>
      {/* Decorative scroller: two identical copies so the -50% translate loops seamlessly. */}
      <div aria-hidden="true" className="min-w-0 flex-1 overflow-hidden">
        <div className="bonus-marquee flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-x-2 pr-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 whitespace-nowrap text-muted"
                >
                  {body}
                  <span className="px-2 text-faint">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">
        {title}. {body}
      </span>
      <span className="inline-flex shrink-0 items-center gap-2 font-mono font-semibold tabular-nums">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
          {t("bonusEndsIn")}
        </span>
        <span className="text-foreground">
          <Countdown targetIso={firstDayBonusClosesIso} label={t("bonusEndsIn")} />
        </span>
      </span>
    </FadeIn>
  )
}

/** Winner settlement note (shown after the sale, so it is flag-gated only and worded conditionally
 *  since eligibility is settled off-app). */
export function FirstDayBonusNote({ force }: { force?: boolean }) {
  const t = useTranslations("Bid")
  const enabled = firstDayBonusEnabled()
  if (!enabled && !force) return null
  return (
    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
      <Icon name="gift" draw={false} className="h-3.5 w-3.5 shrink-0 text-mint" />
      {t("bonusSettlementNote", { pct: PCT })}
    </p>
  )
}
