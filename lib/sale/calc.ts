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

/** Form-level mirror of the balance check in bidPreflightReason (onchain.ts): only the delta
 *  above the committed floor is transferred, compared exactly in token base units.
 *  null = unknown (unreadable balance, bad input) and MUST fail open in the caller - the
 *  on-chain preflight stays the authority; this only saves the user a wasted confirm step. */
export function balanceCoversBid(
  amountUsd: number,
  committedUsd: number,
  balanceUnits: bigint | null,
  decimals: number,
): boolean | null {
  if (balanceUnits == null) return null
  if (!Number.isFinite(amountUsd) || !Number.isFinite(committedUsd)) return null
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) return null
  const deltaUsd = amountUsd - committedUsd
  if (deltaUsd <= 0) return true
  const deltaUnits = Math.round(deltaUsd * 10 ** decimals)
  // A delta too large to represent exactly is beyond any real balance; never throw in render.
  if (!Number.isSafeInteger(deltaUnits)) return false
  return BigInt(deltaUnits) <= balanceUnits
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

/** USD price -> SettlementSale `uint64` price = increment count, round(priceUsd / increment).
 *  FOOTGUN: zero-anchored (the floor is increment*N), NOT floor-anchored - a floor-anchored count sends 0. */
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

/** On-chain `uint64` price (an increment count) -> USD. Exact inverse of the above.
 *  FOOTGUN: multiply in integer micro-USD, never `count * increment` in floats - 33 * 0.0215 is
 *  0.7094999999999999, which loses the `>=` in bidStatus for a bid at the clearing price. */
export function onchainPriceToUsd(price: bigint, incrementUsd: number): number {
  if (!Number.isFinite(incrementUsd) || incrementUsd <= 0) {
    throw new Error("onchainPriceToUsd: increment must be a finite positive number")
  }
  const micro = Number(price) * Math.round(incrementUsd * 1_000_000)
  if (!Number.isSafeInteger(micro)) {
    throw new Error("onchainPriceToUsd: price exceeds safe integer range")
  }
  return micro / 1_000_000
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
