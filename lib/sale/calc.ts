/**
 * Pure sale math. gnotEstimate is an upper estimate (pro-rata settlement may
 * reduce it). The validators reject non-finite input (NaN/Infinity from Number()).
 */
export function gnotEstimate(commitmentUsd: number, clearingPriceUsd: number | null): number {
  if (!clearingPriceUsd || clearingPriceUsd <= 0) return 0
  return commitmentUsd / clearingPriceUsd
}

export function bidStatus(
  myPriceUsd: number | null,
  clearingPriceUsd: number | null,
): "winning" | "outbid" | "none" {
  if (myPriceUsd == null) return "none"
  if (clearingPriceUsd == null) return "winning" // nothing has cleared yet
  return myPriceUsd >= clearingPriceUsd ? "winning" : "outbid"
}

export function validateBidAmount(
  amountUsd: number,
  minUsd: number,
  maxUsd: number,
): "ok" | "too-low" | "too-high" {
  // Reject NaN/Infinity outright (e.g. a "1e9"/hex string coerced by Number()):
  // without this, NaN slips through every comparison below and reads as "ok".
  if (!Number.isFinite(amountUsd)) return "too-low"
  if (amountUsd < minUsd) return "too-low"
  if (amountUsd > maxUsd) return "too-high"
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
  // Reject NaN/Infinity outright (Infinity < min is false, so it would read as
  // a valid price without this guard); the UI also strips non-decimal input.
  if (!Number.isFinite(priceUsd)) return "below-min"
  if (priceUsd < opts.minPriceUsd) return "below-min"
  // Hardcap (confirmed 2026-06-13): bids cannot exceed the maximum price.
  if (opts.maxPriceUsd != null && priceUsd > opts.maxPriceUsd) return "above-max"
  if (opts.incrementUsd != null) {
    // Bids move on the increment grid (confirmed 2026-06-13: $0.00645 steps, any
    // other step is an error). Integer micro-USD math dodges float drift
    // (0.0645 * 1e5 floats to 6450.000000000001).
    const micro = Math.round(priceUsd * 100_000)
    const step = Math.round(opts.incrementUsd * 100_000)
    if (step > 0 && micro % step !== 0) return "off-increment"
  }
  if (opts.prevPriceUsd != null && priceUsd < opts.prevPriceUsd) return "below-previous"
  return "ok"
}

/**
 * On-chain unit conversions for the bid seam (submitBidOnChain). UI math stays in
 * USD floats; ANYTHING that leaves for the contract goes through these, because
 * float-to-integer scaling is exactly where money bugs live (0.12255 * 1e6 floats
 * to 122550.00000000001). Integer-exact: round once, then BigInt.
 */

/** USD amount -> payment-token base units (e.g. 5000 USDC @6 decimals -> 5_000_000_000n).
 *  `decimals` must come from the token/commitment data, never hardcoded. */
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

/** USD price -> integer micro-USD (1e-6 USD). Every grid price (k x $0.00645) is an
 *  exact micro-USD multiple of 6450, so the round is lossless for valid bids.
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

/**
 * Clamp a candidate price into [min, max] and snap it UP onto the increment grid
 * (never past the max, which is itself on the grid). Used for the form's suggested
 * default so the prefilled price always passes validateBidPrice.
 */
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
