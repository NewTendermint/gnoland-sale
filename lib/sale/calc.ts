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
    maxPriceUsd?: number
    incrementUsd?: number
    prevPriceUsd?: number
  },
): "ok" | "below-min" | "above-max" | "off-increment" | "below-previous" {
  if (!Number.isFinite(priceUsd)) return "below-min"
  if (priceUsd < opts.minPriceUsd) return "below-min"
  if (opts.maxPriceUsd != null && priceUsd > opts.maxPriceUsd) return "above-max"
  if (opts.incrementUsd != null) {
    // Integer micro-USD math dodges float drift (0.0645 * 1e5 -> 6450.000000000001).
    const micro = Math.round(priceUsd * 100_000)
    const step = Math.round(opts.incrementUsd * 100_000)
    if (step > 0 && micro % step !== 0) return "off-increment"
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

/** USD price -> integer micro-USD (1e-6 USD).
 *  NOTE: the SettlementSale Bid.price uint64 SCALE is still unconfirmed (A.12.1) -
 *  re-map here once the contract source pins it, never inline at the call site. */
export function priceUsdToMicroUsd(priceUsd: number): bigint {
  if (!Number.isFinite(priceUsd) || priceUsd < 0) {
    throw new Error("priceUsdToMicroUsd: price must be a finite positive number")
  }
  const micro = Math.round(priceUsd * 1_000_000)
  if (!Number.isSafeInteger(micro)) {
    throw new Error("priceUsdToMicroUsd: price exceeds safe integer range")
  }
  return BigInt(micro)
}

/** Clamp into [min, max] and snap UP onto the increment grid (never past max). */
export function snapBidPrice(
  priceUsd: number,
  opts: { minPriceUsd: number; maxPriceUsd: number; incrementUsd: number },
): number {
  const step = Math.round(opts.incrementUsd * 100_000)
  const min = Math.round(opts.minPriceUsd * 100_000)
  const max = Math.round(opts.maxPriceUsd * 100_000)
  const clamped = Math.min(Math.max(Math.round(priceUsd * 100_000), min), max)
  return Math.min(Math.ceil(clamped / step) * step, max) / 100_000
}
