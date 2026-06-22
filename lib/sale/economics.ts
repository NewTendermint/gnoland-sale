// Single source for sale numbers. PROVISIONAL values are flagged; confirm before launch.
// Schedule instants encode 6:00 PM EST as the published times (EST = UTC-5, so 23:00Z);
// the sale close is 5:59 PM EST (22:59Z). The Countdown to saleClosesIso and the phase
// gates derive from these, so the time-of-day is intentional, not midnight.
export const SALE_ECONOMICS = {
  startingPriceUsd: 0.0645, // = minimum price
  maxPriceUsd: 0.129, // hardcap; no further bids once reached
  saleSupplyGnot: 77_500_000,
  totalSupplyGnot: 1_333_000_000,
  hardCapUsd: 10_000_000,
  fdvUsd: 86_000_000,
  hardcapFdvUsd: 172_000_000,
  minCommitmentUsd: 100,
  maxCommitmentUsd: null, // no maximum commitment (team, 2026-06-21; prior $100k provisional cap dropped)
  bidIncrementUsd: 0.00645,
  mainnetIso: "2026-09-01T00:00:00Z",
  multipleWalletsPerEntity: true,
  registrationOpensIso: process.env.NEXT_PUBLIC_REGISTRATION_OPENS ?? "2026-07-06T23:00:00Z", // Mon Jul 6, 6:00 PM EST
  saleOpensIso: process.env.NEXT_PUBLIC_SALE_OPENS ?? "2026-07-20T23:00:00Z", // Mon Jul 20, 6:00 PM EST
  saleClosesIso: process.env.NEXT_PUBLIC_SALE_CLOSES ?? "2026-07-27T22:59:00Z", // Mon Jul 27, 5:59 PM EST
} as const

/** Display a sale ISO date, e.g. "July 15, 2026" (UTC-fixed so SSR and client agree). */
export function formatSaleDate(iso: string, withYear = true): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  })
}

/** Month name of a sale ISO date, e.g. "September" (UTC-fixed). */
export function formatSaleMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC", month: "long" })
}

/**
 * Full schedule line with weekday + time, e.g. "Monday, July 6, 2026 at 6:00 PM EST".
 * Rendered in a fixed UTC-5 zone (Etc/GMT+5) and labeled EST to match the published
 * schedule; the fixed offset (no DST) keeps SSR and client output identical.
 */
export function formatSaleDateTime(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString("en-US", {
    timeZone: "Etc/GMT+5",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const time = d.toLocaleTimeString("en-US", {
    timeZone: "Etc/GMT+5",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  return `${date} at ${time} EST`
}
