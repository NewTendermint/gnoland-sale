// Single source for sale numbers. PROVISIONAL values are flagged; confirm before launch.
export const SALE_ECONOMICS = {
  startingPriceUsd: 0.0645, // = minimum price
  maxPriceUsd: 0.129, // hardcap; no further bids once reached
  saleSupplyGnot: 77_500_000,
  totalSupplyGnot: 1_333_000_000,
  targetRaiseUsd: 2_000_000, // soft cap / floor
  hardCapUsd: 10_000_000,
  fdvUsd: 86_000_000,
  hardcapFdvUsd: 172_000_000,
  // TODO(real-data): confirm the PROVISIONAL values below (min/max commitment)
  // with the team / Sonar before launch.
  minCommitmentUsd: 100,
  maxCommitmentUsd: 100_000, // PROVISIONAL - sheet $100k; Sonar pending. A.12.2 / param #4.
  bidIncrementUsd: 0.00645,
  mainnetIso: "2026-09-01T00:00:00Z",
  multipleWalletsPerEntity: true,
  registrationOpensIso: process.env.NEXT_PUBLIC_REGISTRATION_OPENS ?? "2026-07-01T00:00:00Z",
  saleOpensIso: process.env.NEXT_PUBLIC_SALE_OPENS ?? "2026-07-15T00:00:00Z", // TIME still TBD (param #14)
  saleClosesIso: process.env.NEXT_PUBLIC_SALE_CLOSES ?? "2026-07-21T00:00:00Z",
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
