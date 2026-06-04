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
  opts: { minPriceUsd: number; prevPriceUsd?: number },
): "ok" | "below-min" | "below-previous" {
  // Reject NaN/Infinity outright (Infinity < min is false, so it would read as
  // a valid price without this guard); the UI also strips non-decimal input.
  if (!Number.isFinite(priceUsd)) return "below-min"
  if (priceUsd < opts.minPriceUsd) return "below-min"
  if (opts.prevPriceUsd != null && priceUsd < opts.prevPriceUsd) return "below-previous"
  return "ok"
}
