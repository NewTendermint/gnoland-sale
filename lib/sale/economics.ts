// Single source for sale numbers. Schedule instants are the exact UTC moments from the Sonar
// dashboard, all at 12:00Z on their three dates. The Countdown to saleClosesIso and the phase
// gates derive from these, so the time-of-day is intentional, not midnight.
import { mainnet } from "viem/chains"
import { SALE_CHAIN } from "./contracts"

const startingPriceUsd = 0.0645 // = minimum price (= step 0 of the on-chain bid grid)
const totalSupplyGnot = 1_333_000_000

export const SALE_ECONOMICS = {
  startingPriceUsd,
  saleSupplyGnot: 38_760_000, // ~2.9% of supply (was 77.5M / ~5.8%, halved 2026-06-30)
  totalSupplyGnot,
  // Display-only (token-details section): no code enforces it, a soft-cap decision at settlement
  // is a MANUAL action on the Sonar side, never automatic (team, 2026-06-25).
  softCapUsd: 2_500_000, // reintroduced 2026-06-30 (~ startingPrice x saleSupply = full subscription at the floor)
  fdvUsd: Math.round(startingPriceUsd * totalSupplyGnot), // 85,978,500
  // $100 on mainnet, always; NEXT_PUBLIC_MIN_COMMITMENT_USD only applies off-mainnet (staging/local).
  minCommitmentUsd:
    SALE_CHAIN.id === mainnet.id ? 100 : Number(process.env.NEXT_PUBLIC_MIN_COMMITMENT_USD) || 100,
  maxCommitmentUsd: null, // no maximum commitment (team, 2026-06-21; prior $100k provisional cap dropped)
  // Tiered contribution bonus: extra GNOT granted at the post-mainnet distribution to bidders who
  // receive a final allocation, sized by where their contribution sits in the CUMULATIVE sale
  // total. Bands are cumulative USD ceilings; the pct applies only to the slice of a contribution
  // that falls inside each band (a contribution straddling a boundary is split across bands). The
  // portion above the last ceiling earns nothing. Display-only here - it does NOT touch the sale
  // contract, the permit or the settlement math; the authoritative bonus is computed off-app from
  // on-chain data at distribution. Surfaced only when tieredBonusEnabled() (lib/sale/bonus.ts) is on.
  bonusTiers: [
    { untilUsd: 1_000_000, pct: 15 },
    { untilUsd: 1_500_000, pct: 10 },
    { untilUsd: 2_000_000, pct: 5 },
    { untilUsd: 2_500_000, pct: 3 },
  ],
  // On-chain price = round(priceUsd / increment), zero-anchored (calc.priceUsdToOnchainPrice; verified
  // vs the deployed permit). 0.0215 prod + sandbox (Dongwon 2026-06-30; divides the 0.0645 floor -> 3).
  bidIncrementUsd: 0.0215,
  mainnetIso: "2026-09-01T00:00:00Z",
  multipleWalletsPerEntity: true,
  // The 3 dates drive the page PHASE (pre-sale/live/ended, lib/sale/phase.ts) + the countdowns.
  // Bidding is still enforced on-chain (the contract stage + permit window), so these dates never
  // gate money. LOUD WARNING: keep in sync with the Sonar dashboard (no SDK endpoint exposes
  // them) - if Sonar shifts the schedule, ALL page copy/countdowns/phases here drift. The
  // push/email crons read the contract stage first (lib/sale/live-window.ts) and only fall back
  // to these dates; the UI phase relies on them entirely.
  registrationOpensIso: process.env.NEXT_PUBLIC_REGISTRATION_OPENS ?? "2026-07-09T12:00:00Z", // Thu Jul 9, 12:00 UTC (Sonar dashboard)
  saleOpensIso: process.env.NEXT_PUBLIC_SALE_OPENS ?? "2026-07-20T12:00:00Z", // Mon Jul 20, 12:00 UTC (Sonar dashboard)
  saleClosesIso: process.env.NEXT_PUBLIC_SALE_CLOSES ?? "2026-07-27T12:00:00Z", // Mon Jul 27, 12:00 UTC (Sonar dashboard)
} as const

// Boot invariant: the UI price grid steps from the floor while the contract grid is zero-anchored
// (calc.priceUsdToOnchainPrice), so they only agree while the floor is an exact multiple of the
// step. Integer micro-USD, float modulo would never be 0. Throws at build/boot, never mid-flow.
if (
  Math.round(SALE_ECONOMICS.startingPriceUsd * 1e6) %
    Math.round(SALE_ECONOMICS.bidIncrementUsd * 1e6) !==
  0
) {
  throw new Error("SALE_ECONOMICS: startingPriceUsd must be an integer multiple of bidIncrementUsd")
}

// BCP-47 tag for Intl. Our locale codes ("en"/"ko") map 1:1 to valid Intl locales, so the active
// locale is passed straight through; defaults to English so untouched call sites are unchanged.
type DateLocale = string

/** Display a sale ISO date, e.g. "July 15, 2026" / "2026년 7월 15일" (UTC-fixed so SSR and client agree). */
export function formatSaleDate(iso: string, withYear = true, locale: DateLocale = "en"): string {
  return new Date(iso).toLocaleDateString(locale, {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  })
}

/** Month name of a sale ISO date, e.g. "September" / "9월" (UTC-fixed). */
export function formatSaleMonth(iso: string, locale: DateLocale = "en"): string {
  return new Date(iso).toLocaleDateString(locale, { timeZone: "UTC", month: "long" })
}

/**
 * Full schedule line with weekday + time, e.g. "Thursday, July 9, 2026 at 12:00 UTC".
 * Rendered in UTC to match the Sonar dashboard exactly (no DST ambiguity; SSR and client agree).
 * The English " at " connector is dropped for locales (e.g. Korean) that read date + time adjacently.
 */
export function formatSaleDateTime(iso: string, locale: DateLocale = "en"): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString(locale, {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const time = d.toLocaleTimeString(locale, {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const connector = locale.startsWith("en") ? " at " : " "
  return `${date}${connector}${time} UTC`
}
