"use client"

import { BONUS_TIERS, currentTier, tieredBonusEnabled } from "@/lib/sale/bonus"
import { fmtCompactUsd } from "@/lib/sale/format"
import { useTranslations } from "next-intl"
import { Icon } from "../../(ui)/Icon"

// Display-only tiered-bonus surfaces: gated by the environment flag; `force` bypasses it for the dev
// gallery. Nothing here reads or writes sale state - the authoritative bonus is computed off-app.

/** Whether a bonus surface should render (env flag on, or `force`d for the gallery). */
function bonusShown(force = false): boolean {
  return force || tieredBonusEnabled()
}

// Mint highlight badge - the design's positive-accent surface.
const BONUS_TAG =
  "shrink-0 rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-mint"

/** Gate for the always-on content surfaces (sale-terms row, FAQ). */
export function useBonusVisible(): boolean {
  return bonusShown()
}

/** Header strip: current-tier pill + scarcity figure (amount until the next tier) on the left, and a
 *  scrolling promo marquee that fills the row on lg+. Renders while enabled (or `force`d). */
export function TierBonusMeter({
  cumulativeUsd,
  force = false,
}: {
  cumulativeUsd: number
  force?: boolean
}) {
  const t = useTranslations("BidPanel")
  const shown = bonusShown(force)
  if (!shown) return null

  const tier = currentTier(cumulativeUsd)
  const topPct = BONUS_TIERS[0].pct
  const idx = tier ? BONUS_TIERS.findIndex((b) => b.untilUsd === tier.untilUsd) : -1
  const nextPct = idx >= 0 ? BONUS_TIERS[idx + 1]?.pct : undefined
  // Pre-sale teaser, closed, or the standard live line.
  const marquee =
    cumulativeUsd <= 0
      ? t("bonusStripPresale", { pct: topPct })
      : tier == null
        ? t("bonusStripClosed")
        : t("bonusStripWhat", { pct: tier.pct })
  const title = t("bonusBannerTitle")

  return (
    <div className="mb-3 flex items-center gap-3 overflow-hidden py-1 text-xs lg:gap-6">
      {/* Pill + scarcity figure. On mobile it takes the row and the text wraps (marquee hidden < lg);
          on lg+ it sits at its natural width beside the marquee. */}
      <span className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
        {tier ? <span className={BONUS_TAG}>{t("bonusPill", { pct: tier.pct })}</span> : null}
        {tier && nextPct != null ? (
          // t.rich keeps the amount a styled chunk while letting each locale order the sentence.
          <span className="min-w-0 text-[11px] font-bold uppercase leading-tight tracking-[0.15em] text-foreground">
            {t.rich("bonusScarcity", {
              amount: fmtCompactUsd(tier.remainingUsd),
              next: nextPct,
              b: (chunks) => (
                <span className="mx-0.5 font-mono text-sm normal-case tracking-normal">
                  {chunks}
                </span>
              ),
            })}
          </span>
        ) : null}
      </span>
      {/* Marquee (lg+ only; no room on narrow bars). Two copies so the -50% translate loops. */}
      <div aria-hidden="true" className="hidden min-w-0 flex-1 overflow-hidden lg:block">
        <div className="bonus-marquee flex w-max">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center gap-x-2 pr-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 whitespace-nowrap text-muted"
                >
                  {marquee}
                  <span className="px-2 text-faint">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">
        {title}. {marquee}
      </span>
    </div>
  )
}

/** Footer compliance disclaimer for the bonus. */
export function TierBonusDisclaimer() {
  const t = useTranslations("Footer")
  const shown = bonusShown()
  if (!shown) return null
  return <p className="mb-2 max-w-3xl text-xs text-muted">{t("bonusDisclaimer")}</p>
}

/** Settlement note for allocated bidders. Generic wording so it covers any applicable bonus; worded
 *  conditionally since eligibility and amounts are settled off-app. */
export function TierBonusSettlementNote({ force = false }: { force?: boolean }) {
  const t = useTranslations("Bid")
  const shown = bonusShown(force)
  if (!shown) return null
  return (
    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
      <Icon name="gift" draw={false} className="h-3.5 w-3.5 shrink-0 text-mint" />
      {t("bonusSettlementNote")}
    </p>
  )
}
