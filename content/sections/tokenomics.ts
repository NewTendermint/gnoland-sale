/**
 * Content data for the Tokenomics section.
 *
 * Section copy for the build (dev-facing).
 *
 * Source of truth for the numbers below: the team "$GNOT Vesting Schedule -
 * Allocation & Distribution" sheet (genesis allocation, monthly distribution,
 * unlock schedule, total supply). These are the
 * real, as-of-today figures, not placeholders. Verified: the seven category
 * quantities sum to 1,333,000,000 GNOT and each percent = quantity / total.
 */

import { SALE_ECONOMICS } from "../../lib/sale/economics"

export type AllocationRow = {
  /** Stable id, keys into the "Tokenomics" message namespace (alloc.<id>.category / .note / .footnote). */
  id: string
  /** Share of total supply, percent (e.g. 26.26). */
  percent: number
  /** Absolute allocation in GNOT. */
  amount: number
  /** Whether an asterisked footnote is rendered at the bottom of the distribution tile. */
  hasFootnote?: boolean
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
    id: "airdrop1-cosmos",
    percent: 26.26,
    amount: 350_000_000,
    color: "color-mix(in srgb, var(--foreground) 100%, transparent)",
  },
  {
    id: "newtendermint",
    percent: 24.91,
    amount: 332_000_000,
    color: "color-mix(in srgb, var(--foreground) 70%, transparent)",
  },
  {
    id: "investors",
    percent: 22.51,
    amount: 300_000_000,
    hasFootnote: true,
    color: "color-mix(in srgb, var(--foreground) 50%, transparent)",
  },
  {
    id: "airdrop2-atomone",
    percent: 17.33,
    amount: 231_000_000,
    color: "color-mix(in srgb, var(--foreground) 35%, transparent)",
  },
  {
    id: "ecosystem-treasury",
    percent: 4.5,
    amount: 60_000_000,
    color: "color-mix(in srgb, var(--foreground) 24%, transparent)",
  },
  {
    id: "core-treasury",
    percent: 3.0,
    amount: 40_000_000,
    color: "color-mix(in srgb, var(--foreground) 15%, transparent)",
  },
  {
    id: "validator-treasury",
    percent: 1.5,
    amount: 20_000_000,
    color: "color-mix(in srgb, var(--foreground) 9%, transparent)",
  },
]

// Unlock schedule, rendered nowhere. Bid.allocationNote only says one exists.
// 7% at TGE, 7% each month, 9% final: 13 x 7% + 9% = 100%. No cliff.

export type CirculatingRow = {
  /** Stable id, keys into the "Tokenomics" message namespace (circ.<id>.category). */
  id: string
  /** GNOT liquid at mainnet launch (TGE). */
  amount: number
  /** Sub-allocations shown indented under the row (e.g. the Investor Pool). */
  children?: Array<{ id: string; amount: number; highlight?: boolean }>
}

// Circulating supply at mainnet launch (TGE). Tree: the Investor
// Pool circulates 156,000,000 - its listed children (Investors 111,240,000 + Token Sale
// 38,760,000 = 150M) plus the 6M 4%-pool unlock that is NOT itemised. The other genesis
// categories release ~4%. Top-level amounts sum to 197,320,000 (children are inside the pool).
export const circulatingBreakdown: CirculatingRow[] = [
  {
    id: "investors-pool",
    amount: 156_000_000,
    children: [
      { id: "investors", amount: 111_240_000 },
      { id: "token-sale", amount: 38_760_000, highlight: true },
    ],
  },
  { id: "airdrop1-cosmos", amount: 14_000_000 },
  { id: "newtendermint", amount: 13_280_000 },
  { id: "airdrop2-atomone", amount: 9_240_000 },
  { id: "ecosystem-treasury", amount: 2_400_000 },
  { id: "core-treasury", amount: 1_600_000 },
  { id: "validator-treasury", amount: 800_000 },
]

export const circulating = {
  /** Sum of the breakdown top-level amounts = 197,320,000. */
  total: circulatingBreakdown.reduce((sum, row) => sum + row.amount, 0),
  tokenSaleSupply: 38_760_000,
  /** = startingPrice x total supply (85,978,500). */
  fdvUsd: SALE_ECONOMICS.fdvUsd,
}
