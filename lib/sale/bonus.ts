// Tiered contribution bonus PROMO - display-only helpers.
//
// The promo: extra GNOT granted to bidders who receive a final allocation (winners) at settlement,
// sized by where their contribution sits in the CUMULATIVE sale total. The sale is carved into
// cumulative USD bands ($0-1M -> 15%, 1-1.5M -> 10%, 1.5-2M -> 5%, 2-2.5M -> 3%); the pct applies
// only to the slice of a contribution that falls inside each band, so a contribution straddling a
// boundary is split across bands (see blendedBonus). The bonus is distributed OFF-APP, post-mainnet,
// from a SEPARATE investor-pool reserve (not the sale allocation). NOTHING in the sale flow changes:
// the deployed SettlementSale contract, the purchase permit, the bid path and the settlement math
// are all untouched. These helpers only drive marketing copy and a display-only estimate.
//
// The estimate shown in-app is a PROJECTION at the current sale total: it uses live committed USD
// (not the accepted amount at clearing), the running total moves as bids are raised, and the
// authoritative band placement is reconstructed off-app from the immutable on-chain arrival order at
// settlement. Everything user-facing is worded "estimated / at the current sale total".
import { gnotEstimate } from "./calc"
import { SALE_ECONOMICS } from "./economics"

/** The cumulative bonus bands, in ascending ceiling order. Re-exported so UI can draw the ladder. */
export const BONUS_TIERS = SALE_ECONOMICS.bonusTiers

/** Top of the last band: the cumulative total past which no further bonus applies. */
export const BONUS_CAP_USD = BONUS_TIERS[BONUS_TIERS.length - 1].untilUsd

/** Whether the bonus surfaces render at all. Production requires the explicit flag; dev defaults on. */
export function tieredBonusEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_TIERED_BONUS === "1") return true
  return process.env.NODE_ENV === "development"
}

export type Tier = {
  /** The band's bonus percentage. */
  pct: number
  /** Cumulative USD floor of the band (inclusive). */
  fromUsd: number
  /** Cumulative USD ceiling of the band (exclusive). */
  untilUsd: number
  /** USD left inside this band from `cumulativeUsd` up to the ceiling. */
  remainingUsd: number
}

/** The band a dollar arriving at `cumulativeUsd` falls into - i.e. the tier the NEXT bid starts
 *  earning. null once the cumulative total has reached the cap (no band left). */
export function currentTier(cumulativeUsd: number): Tier | null {
  let fromUsd = 0
  for (const tier of BONUS_TIERS) {
    if (cumulativeUsd < tier.untilUsd) {
      return {
        pct: tier.pct,
        fromUsd,
        untilUsd: tier.untilUsd,
        remainingUsd: tier.untilUsd - Math.max(cumulativeUsd, fromUsd),
      }
    }
    fromUsd = tier.untilUsd
  }
  return null
}

/** One band's share of a contribution: the USD slice that lands in it and that band's pct. */
export type BonusSegment = { pct: number; amountUsd: number }

export type BlendedBonus = {
  /** Per-band breakdown of the contribution, in ascending band order (only non-empty slices). */
  segments: BonusSegment[]
  /** Weighted bonus percentage over the whole contribution (0 when none of it earns). */
  effectivePct: number
  /** Estimated EXTRA GNOT at the clearing price, summed across bands. */
  gnotBonus: number
}

/** Split the contribution slice [cumulativeUsd, cumulativeUsd + amountUsd] across the bands and
 *  return the weighted bonus. `clearingPriceUsd` converts each band's USD slice into estimated GNOT
 *  (base GNOT = slice / clearing, bonus = base * pct). The portion above the cap earns nothing.
 *  Pure: the caller supplies the live cumulative total and clearing price. */
export function blendedBonus(
  cumulativeUsd: number,
  amountUsd: number,
  clearingPriceUsd: number | null,
): BlendedBonus {
  const start = Math.max(0, cumulativeUsd)
  const end = start + Math.max(0, amountUsd)
  const segments: BonusSegment[] = []
  let bandStart = 0
  let gnotBonus = 0
  for (const tier of BONUS_TIERS) {
    const overlap = Math.min(end, tier.untilUsd) - Math.max(start, bandStart)
    if (overlap > 0) {
      segments.push({ pct: tier.pct, amountUsd: overlap })
      gnotBonus += gnotEstimate(overlap, clearingPriceUsd) * (tier.pct / 100)
    }
    bandStart = tier.untilUsd
  }
  const baseGnot = gnotEstimate(Math.max(0, amountUsd), clearingPriceUsd)
  const effectivePct = baseGnot > 0 ? (gnotBonus / baseGnot) * 100 : 0
  return { segments, effectivePct, gnotBonus }
}
