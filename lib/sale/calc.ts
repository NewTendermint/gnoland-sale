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

/** USD price -> SettlementSale `uint64` price = increment count, round(priceUsd / increment). Verified
 *  against the deployed permit (sandbox): floor 0.0645 / 0.00645 = minPrice 10, cap 0.258 = maxPrice 40.
 *  FOOTGUN: zero-anchored (the floor is increment*N), NOT floor-anchored - the floor-anchored bug sent 0. */
export function priceUsdToOnchainPrice(priceUsd: number, incrementUsd: number): bigint {
  if (!Number.isFinite(priceUsd) || priceUsd < 0) {
    throw new Error("priceUsdToOnchainPrice: price must be a finite positive number")
  }
  if (!Number.isFinite(incrementUsd) || incrementUsd <= 0) {
    throw new Error("priceUsdToOnchainPrice: increment must be a finite positive number")
  }
  const microPrice = Math.round(priceUsd * 1_000_000)
  const microIncrement = Math.round(incrementUsd * 1_000_000)
  if (!Number.isSafeInteger(microPrice)) {
    throw new Error("priceUsdToOnchainPrice: price exceeds safe integer range")
  }
  return BigInt(Math.round(microPrice / microIncrement))
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
