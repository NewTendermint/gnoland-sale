/**
 * Pure sale math. percentFilled is a DERIVED metric (Sonar has no such field,
 * REQUIREMENTS A.13.1) - label it "estimated" in the UI until the formula is
 * confirmed. gnotEstimate is an upper estimate (pro-rata settlement may reduce it).
 */
export function percentFilled(
  totalCommittedUsd: number,
  clearingPriceUsd: number | null,
  supplyGnot: number,
): number {
  if (!clearingPriceUsd || clearingPriceUsd <= 0 || supplyGnot <= 0) return 0
  const ratio = totalCommittedUsd / (clearingPriceUsd * supplyGnot)
  return Math.max(0, Math.min(1, ratio))
}

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
  if (amountUsd < minUsd) return "too-low"
  if (amountUsd > maxUsd) return "too-high"
  return "ok"
}

export function validateBidPrice(
  priceUsd: number,
  opts: { minPriceUsd: number; prevPriceUsd?: number },
): "ok" | "below-min" | "below-previous" {
  if (priceUsd < opts.minPriceUsd) return "below-min"
  if (opts.prevPriceUsd != null && priceUsd < opts.prevPriceUsd) return "below-previous"
  return "ok"
}
