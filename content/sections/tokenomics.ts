/**
 * Content data for the Tokenomics section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing).
 *
 * Source of truth for the numbers below: the team "$GNOT Vesting Schedule -
 * Allocation & Distribution" sheet (genesis allocation + monthly distribution)
 * and `content/sections.md` #3 (unlock schedule, total supply). These are the
 * real, as-of-today figures, not placeholders. Verified: the seven category
 * quantities sum to 1,333,000,000 GNOT and each percent = quantity / total.
 */

export type AllocationRow = {
  category: string
  /** Share of total supply, percent (e.g. 26.26). */
  percent: number
  /** Absolute allocation in GNOT. */
  amount: number
  /** Purpose, verbatim from the source sheet. */
  note: string
  color: string
}

/** Genesis total supply, GNOT. No inflation after distribution ends. */
export const TOTAL_SUPPLY = 1_333_000_000

// Genesis allocation, seven categories. Ordered largest -> smallest so the
// stacked bar and the on-contrast ink ramp (darkest = largest) read together.
// Colors use the foreground ink so the bar + legend read on the grey surface-alt
// tile: a black-to-grey ramp in light mode, white-to-grey in dark mode.
export const allocation: AllocationRow[] = [
  {
    category: "Airdrop1 - Cosmos",
    percent: 26.26,
    amount: 350_000_000,
    note: "From partial Cosmos governance snapshot 3 years ago",
    color: "color-mix(in srgb, var(--foreground) 100%, transparent)",
  },
  {
    category: "NEWTENDERMINT, LLC",
    percent: 24.91,
    amount: 332_000_000,
    note: "For use at NT,LLC discretion",
    color: "color-mix(in srgb, var(--foreground) 70%, transparent)",
  },
  {
    category: "Investors",
    percent: 22.51,
    amount: 300_000_000,
    note: "For past and future investors",
    color: "color-mix(in srgb, var(--foreground) 50%, transparent)",
  },
  {
    category: "Airdrop2 - AtomOne",
    percent: 17.33,
    amount: 231_000_000,
    note: "From recent AtomOne snapshot prior to launch",
    color: "color-mix(in srgb, var(--foreground) 35%, transparent)",
  },
  {
    category: "Ecosystem Treasury",
    percent: 4.5,
    amount: 60_000_000,
    note: "For prior and future Gno.land ecosystem development",
    color: "color-mix(in srgb, var(--foreground) 24%, transparent)",
  },
  {
    category: "Core Treasury",
    percent: 3.0,
    amount: 40_000_000,
    note: "For paying for core development",
    color: "color-mix(in srgb, var(--foreground) 15%, transparent)",
  },
  {
    category: "Validator Treasury",
    percent: 1.5,
    amount: 20_000_000,
    note: "For paying validators",
    color: "color-mix(in srgb, var(--foreground) 9%, transparent)",
  },
]

// Unlock schedule. Identical for every allocation: 7% at mainnet launch (TGE,
// the day GNOT becomes transferable), 7% each subsequent month, 9% in the
// final month. 13 x 7% + 9% = 100%, fully vested 13 months after mainnet
// (distribution runs months 1-14). No cliff. Mirrors sections.md #3.
export const vesting = {
  tgeUnlockPct: 7,
  monthlyUnlockPct: 7,
  finalUnlockPct: 9,
  /** Fully vested this many months after mainnet launch. */
  fullyVestedMonths: 13,
  /** Distribution spans this many monthly releases (m1..m14). */
  distributionMonths: 14,
  cliff: "None",
  /** Circulating at TGE = 7% of total supply. */
  circulatingAtTge: 93_310_000,
  circulatingAtTgePct: 7,
}

// Per-month unlock as percent of an allocation, for the unlock-timeline bars.
// First 13 months release 7%, the 14th releases 9% (sums to 100%).
export const monthlyUnlocks: number[] = [
  ...Array(vesting.distributionMonths - 1).fill(vesting.monthlyUnlockPct),
  vesting.finalUnlockPct,
]

export type CirculatingRow = {
  category: string
  /** GNOT liquid at mainnet launch (TGE). */
  amount: number
  /** Sub-allocations shown indented under the row (e.g. the Investor Pool). */
  children?: Array<{ category: string; amount: number; highlight?: boolean }>
}

// Circulating supply at mainnet launch (TGE), team spec 2026-06-30. Tree: the Investor
// Pool circulates 156,000,000 - its listed children (Investors 111,240,000 + Token Sale
// 38,760,000 = 150M) plus the 6M 4%-pool unlock that is NOT itemised. The other genesis
// categories release ~4%. Top-level amounts sum to 197,320,000 (children are inside the pool).
export const circulatingBreakdown: CirculatingRow[] = [
  {
    category: "Investors Pool",
    amount: 156_000_000,
    children: [
      { category: "Investors", amount: 111_240_000 },
      { category: "Token Sale", amount: 38_760_000, highlight: true },
    ],
  },
  { category: "Airdrop1 - Cosmos", amount: 14_000_000 },
  { category: "NEWTENDERMINT, LLC", amount: 13_280_000 },
  { category: "Airdrop2 - AtomOne", amount: 9_240_000 },
  { category: "Ecosystem Treasury", amount: 2_400_000 },
  { category: "Core Treasury", amount: 1_600_000 },
  { category: "Validator Treasury", amount: 800_000 },
]

export const circulating = {
  /** Sum of the breakdown top-level amounts = 197,320,000 (team 2026-06-30). */
  total: circulatingBreakdown.reduce((sum, row) => sum + row.amount, 0),
  tokenSaleSupply: 38_760_000,
  /** Verbatim from the team sheet. */
  lockup: "1-Year Lockup for US Investors Only",
  /** = startingPrice $0.0645 x TOTAL_SUPPLY 1,333,000,000. */
  fdvUsd: 85_948_500,
}
