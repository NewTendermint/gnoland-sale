"use client"

import { BONUS_TIERS, currentTier, tieredBonusEnabled } from "@/lib/sale/bonus"
import { fmtCompactUsd } from "@/lib/sale/format"
import { useTranslations } from "next-intl"
import { Icon } from "../../(ui)/Icon"

/** Whether a bonus surface should render: the environment gate (tieredBonusEnabled), or `force` for
 *  the dev-states gallery. */
function bonusShown(force = false): boolean {
  return force || tieredBonusEnabled()
}

// Promo surfaces for the tiered contribution bonus. Display-only: nothing here reads or writes sale
// state, it only shows marketing copy and a PROJECTED estimate at the current sale total. Gated by
// tieredBonusEnabled() so it stays off unless explicitly turned on. `force` pins a surface on for the
// dev-states gallery (bypasses the flag), so it never leaks into production - only the gallery passes
// it. The authoritative bonus is computed off-app from on-chain data at the post-mainnet distribution.

// Editorial highlight tag, same idiom as the "winning" badge in FunnelSteps: solid mint, bold
// uppercase, mono tracking. The only accent surface the design uses for a positive highlight.
const BONUS_TAG =
  "shrink-0 rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-mint"

/** Whether the always-on content surfaces (sale-terms row, FAQ) should render. */
export function useBonusVisible(): boolean {
  return bonusShown()
}

/** Tiered-bonus header strip for the panel (white area, above the metrics). A compact one-line
 *  banner: a LABELED tier bar on the left (each stage's %, the current tier filled in mint and the
 *  rest faint - so "which tiers exist" and "where we are now" both read at a glance), a scrolling
 *  marquee explaining the promo + how much more must be committed before the bonus drops a tier, and
 *  the current-tier pill on the right. Marquee is decorative (aria-hidden) with an sr-only equivalent
 *  and holds still under reduced motion. No per-bid math. Renders only while enabled (or `force`d). */
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
  // Marquee = what the promo is (context). Pre-sale gets the "up to 15%" teaser; live gets the
  // plain "winners earn bonus GNOT" line - the urgency $ figure lives on the right, not here.
  const marquee =
    cumulativeUsd <= 0
      ? t("bonusStripPresale", { pct: topPct })
      : tier == null
        ? t("bonusStripClosed")
        : t("bonusStripWhat", { pct: tier.pct })
  const title = t("bonusBannerTitle")

  return (
    <div className="mb-3 flex items-center gap-6 overflow-hidden py-1 text-xs lg:gap-8">
      {/* Left cluster, read as one unit: the current-tier pill + the scarcity figure (how much more
          must be committed before the bonus drops). This is the actionable "reward + act now" pair;
          the marquee sits to its right. Visible on every breakpoint (the push to bid). */}
      <span className="flex shrink-0 items-center gap-3">
        {tier ? <span className={BONUS_TAG}>{t("bonusPill", { pct: tier.pct })}</span> : null}
        {tier && nextPct != null ? (
          // t.rich so the amount stays a prominent styled chunk while the sentence word-order is
          // localized (EN leads with the amount; KO embeds it mid-sentence).
          <span className="text-[11px] font-bold uppercase leading-none tracking-[0.15em] text-foreground">
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
      {/* Marquee on the right, filling the remaining width. Two identical copies so the -50%
          translate loops seamlessly. */}
      <div aria-hidden="true" className="min-w-0 flex-1 overflow-hidden">
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

/** Footer compliance disclaimer for the bonus. Stays whenever the bonus is enabled (like the FAQ,
 *  the persistent info/legal layer). Rendered as a Footer client island. */
export function TierBonusDisclaimer() {
  const t = useTranslations("Footer")
  const shown = bonusShown()
  if (!shown) return null
  return <p className="mb-2 max-w-3xl text-xs text-muted">{t("bonusDisclaimer")}</p>
}

/** Settlement note shown to allocated bidders after the sale. Intentionally GENERIC ("any bonus GNOT
 *  you are eligible for") so it covers every bonus offer that may apply (the tiered contribution
 *  bonus and any earlier promo), without duplicating a per-offer message. Flag-gated + worded
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
