import type { InvestingRegion } from "./types"

/** Upper GNOT estimate; pro-rata settlement may reduce it. */
export function gnotEstimate(commitmentUsd: number, clearingPriceUsd: number | null): number {
  if (!clearingPriceUsd || clearingPriceUsd <= 0) return 0
  return commitmentUsd / clearingPriceUsd
}

/** How much the clearing can still rise (as a fraction of itself) before this bid is outbid.
 *  0 = at the clearing price (first to be outbid), >0 = headroom, null before anything clears. */
export function bidHeadroomPct(
  bidPriceUsd: number,
  clearingPriceUsd: number | null,
): number | null {
  if (!clearingPriceUsd || clearingPriceUsd <= 0) return null
  return (bidPriceUsd - clearingPriceUsd) / clearingPriceUsd
}

export function bidStatus(
  myPriceUsd: number | null,
  clearingPriceUsd: number | null,
): "winning" | "outbid" | "none" {
  if (myPriceUsd == null) return "none"
  if (clearingPriceUsd == null) return "winning"
  return myPriceUsd >= clearingPriceUsd ? "winning" : "outbid"
}

/** US entities must carry the on-chain Bid.lockup flag when the sale forces it; the contract
 *  rejects a US commitment without it (BidMustHaveLockup). Region is server-derived
 *  (EntitySnapshot.investingRegion), never client-claimed. */
export function forceLockupForRegion(region: InvestingRegion | null | undefined): boolean {
  return region === "us"
}

export function validateBidAmount(
  amountUsd: number,
  minUsd: number,
  maxUsd: number | null,
): "ok" | "too-low" | "too-high" {
  if (!Number.isFinite(amountUsd)) return "too-low"
  if (amountUsd < minUsd) return "too-low"
  if (maxUsd != null && amountUsd > maxUsd) return "too-high"
  return "ok"
}

export function validateBidPrice(
  priceUsd: number,
  opts: {
    minPriceUsd: number
    incrementUsd?: number
    prevPriceUsd?: number
  },
): "ok" | "below-min" | "off-increment" | "below-previous" {
  // No upper price cap.
  if (!Number.isFinite(priceUsd)) return "below-min"
  if (priceUsd < opts.minPriceUsd) return "below-min"
  if (opts.incrementUsd != null) {
    // FLOOR-ANCHORED grid: valid prices are minPrice + k*increment. Integer micro-USD math dodges float drift.
    const micro = Math.round(priceUsd * 100_000)
    const min = Math.round(opts.minPriceUsd * 100_000)
    const step = Math.round(opts.incrementUsd * 100_000)
    if (step > 0 && (micro - min) % step !== 0) return "off-increment"
  }
  if (opts.prevPriceUsd != null && priceUsd < opts.prevPriceUsd) return "below-previous"
  return "ok"
}

// On-chain unit conversions for the bid seam. Integer-exact: round once, then BigInt.

/** USD amount -> payment-token base units. `decimals` must come from token data, never hardcoded. */
export function usdToTokenUnits(amountUsd: number, decimals: number): bigint {
  if (!Number.isFinite(amountUsd) || amountUsd < 0) {
    throw new Error("usdToTokenUnits: amount must be a finite positive number")
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) {
    throw new Error("usdToTokenUnits: decimals out of range")
  }
  const units = Math.round(amountUsd * 10 ** decimals)
  if (!Number.isSafeInteger(units)) {
    throw new Error("usdToTokenUnits: amount exceeds safe integer range")
  }
  return BigInt(units)
}

/** USD price -> SettlementSale `uint64` on-chain price = STEP INDEX from the floor:
 *  step = (priceUsd - minPrice) / increment (minPrice = step 0). Integer micro-USD math keeps it
 *  float-drift exact; callers pass an on-grid price (validateBidPrice), off-grid rounds to nearest.
 *  TODO: verify this encoding against the deployed SettlementSale via scripts/probe-sale.mjs before launch. */
export function priceUsdToStepIndex(
  priceUsd: number,
  minPriceUsd: number,
  incrementUsd: number,
): bigint {
  if (!Number.isFinite(priceUsd) || priceUsd < 0) {
    throw new Error("priceUsdToStepIndex: price must be a finite positive number")
  }
  if (!Number.isFinite(incrementUsd) || incrementUsd <= 0) {
    throw new Error("priceUsdToStepIndex: increment must be a finite positive number")
  }
  const microPrice = Math.round(priceUsd * 1_000_000)
  const microMin = Math.round(minPriceUsd * 1_000_000)
  const microIncrement = Math.round(incrementUsd * 1_000_000)
  if (!Number.isSafeInteger(microPrice)) {
    throw new Error("priceUsdToStepIndex: price exceeds safe integer range")
  }
  const step = Math.round((microPrice - microMin) / microIncrement)
  if (step < 0) {
    throw new Error("priceUsdToStepIndex: price is below the floor")
  }
  return BigInt(step)
}

/** Clamp to >= min and snap UP onto the FLOOR-ANCHORED grid (minPrice + k*increment). No upper cap. */
export function snapBidPrice(
  priceUsd: number,
  opts: { minPriceUsd: number; incrementUsd: number },
): number {
  const step = Math.round(opts.incrementUsd * 100_000)
  const min = Math.round(opts.minPriceUsd * 100_000)
  const clamped = Math.max(Math.round(priceUsd * 100_000), min)
  return (min + Math.ceil((clamped - min) / step) * step) / 100_000
}
