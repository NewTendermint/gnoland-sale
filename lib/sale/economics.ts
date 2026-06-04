/**
 * Single source for sale numbers so a value change is one edit.
 * Values: content/sections.md #3 + docs/REQUIREMENTS_FROM_TEAMS.md A.12.2 (2026-05-30 Sonar call).
 * PROVISIONAL values are flagged; confirm with the team before launch.
 */
export const SALE_ECONOMICS = {
  startingPriceUsd: 0.0645, // = minimum price (confirmed). NO maximum price (param list #6 = NA).
  saleSupplyGnot: 31_000_000, // confirmed
  totalSupplyGnot: 1_333_000_000, // confirmed
  targetRaiseUsd: 2_000_000, // floor, may grow if oversubscribed (confirmed)
  fdvUsd: 86_000_000, // confirmed ($0.0645 x 1.333B)
  // TODO(real-data): confirm the PROVISIONAL values below (min/max commitment, bid
  // increment, sale dates) with the team / Sonar before launch.
  minCommitmentUsd: 200, // PROVISIONAL - sheet $200; Sonar pending (~$100 example). A.12.2 / param #3.
  maxCommitmentUsd: 100_000, // PROVISIONAL - sheet $100k; Sonar pending. A.12.2 / param #4.
  bidIncrementUsd: 0.005, // PROVISIONAL - proposed $0.005; NOT enforced on-chain (A.12.1). Param #7.
  multipleWalletsPerEntity: true, // confirmed (param #13); contract caps via MaxWalletsPerEntityExceeded
  // Dates are flags: override via env NEXT_PUBLIC_REGISTRATION_OPENS / NEXT_PUBLIC_SALE_OPENS /
  // NEXT_PUBLIC_SALE_CLOSES (ISO).
  registrationOpensIso: process.env.NEXT_PUBLIC_REGISTRATION_OPENS ?? "2026-07-01T00:00:00Z", // confirmed
  saleOpensIso: process.env.NEXT_PUBLIC_SALE_OPENS ?? "2026-07-15T00:00:00Z", // TIME still TBD (param #14)
  // PLACEHOLDER close date so the live bar can show a "Time left" countdown. NOT confirmed: the end
  // date is kept vague and may be extended (A.12.2 / Q&A #7). When the on-chain Stage is wired it is
  // the source of truth; this flag is the dev/fallback value. Flip via NEXT_PUBLIC_SALE_CLOSES.
  saleClosesIso: process.env.NEXT_PUBLIC_SALE_CLOSES ?? "2026-07-29T00:00:00Z", // PLACEHOLDER
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
