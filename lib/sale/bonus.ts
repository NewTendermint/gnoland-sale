// First-24h bonus PROMO - display-only helpers.
//
// The promo: a GNOT bonus granted to entities that place a bid within the first 24h of the sale
// opening AND win at settlement. It is distributed OFF-APP, post-mainnet, from a SEPARATE
// investor-pool reserve (not the sale allocation). NOTHING in the sale flow changes: the deployed
// SettlementSale contract, the purchase permit, the bid path and the settlement/allocation math are
// all untouched. These helpers only drive marketing copy, a countdown and a display-only bonus
// estimate. The authoritative bonus is computed off-app from on-chain data at distribution.
//
// Eligibility ("bid in the first 24h") must be read from the immutable BidPlaced event log, NOT the
// contract's mutable per-entity bidTimestamp (source-verified: it stores the LAST bid, overwritten on
// every raise). That extraction is an off-app, post-sale job - it is intentionally not done here.
import { SALE_ECONOMICS } from "./economics"

const DAY_MS = 24 * 60 * 60 * 1000

/** UTC instant when the bonus window closes = sale open + 24h. Derived from the single source of
 *  truth (saleOpensIso), so it tracks any Sonar schedule change automatically. */
export const firstDayBonusClosesIso = new Date(
  new Date(SALE_ECONOMICS.saleOpensIso).getTime() + DAY_MS,
).toISOString()

/** Whether the promo is surfaced at all. Prod requires the explicit flag; dev shows it by default so
 *  it is reviewable. Flipping this on in production is gated on legal (MiCA + US) sign-off. */
export function firstDayBonusEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_FIRST_DAY_BONUS === "1") return true
  return process.env.NODE_ENV === "development"
}

/** True while `nowMs` is inside [sale open, sale open + 24h). The caller passes the clock so the
 *  function stays pure and testable; the boundary is exclusive at +24h. */
export function isWithinBonusWindow(nowMs: number): boolean {
  const opens = new Date(SALE_ECONOMICS.saleOpensIso).getTime()
  return nowMs >= opens && nowMs < opens + DAY_MS
}
