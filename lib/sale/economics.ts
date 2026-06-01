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
  minCommitmentUsd: 200, // PROVISIONAL - sheet $200; Sonar pending (~$100 example). A.12.2 / param #3.
  maxCommitmentUsd: 100_000, // PROVISIONAL - sheet $100k; Sonar pending. A.12.2 / param #4.
  bidIncrementUsd: 0.005, // PROVISIONAL - proposed $0.005; NOT enforced on-chain (A.12.1). Param #7.
  multipleWalletsPerEntity: true, // confirmed (param #13); contract caps via MaxWalletsPerEntityExceeded
  registrationOpensIso: "2026-07-01T00:00:00Z", // date confirmed
  saleOpensIso: "2026-07-15T00:00:00Z", // DATE confirmed; TIME TBD (param #14) - midnight UTC placeholder
  // saleClosesIso intentionally omitted: end date kept vague, may be extended (A.12.2 / Q&A #7).
  // The live countdown reads the on-chain Stage, never a hardcoded close date.
} as const
