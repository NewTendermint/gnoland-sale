/**
 * Content data for the Tokenomics section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing).
 */

export type AllocationRow = {
  category: string
  percent: number
  color: string
}

export type TreasuryRow = {
  category: string
  percent: number
  note: string
  color: string
}

// Standard ICO allocation categories used as illustrative examples.
// Real % + vesting pending team disclosure.
// Colors use the on-contrast ink so they flip with the tile (white ink on
// the black tile in light mode, black ink on the white tile in dark mode).
export const allocation: AllocationRow[] = [
  {
    category: "Public sale",
    percent: 16.67,
    color: "color-mix(in srgb, var(--on-contrast) 100%, transparent)",
  },
  {
    category: "Core team",
    percent: 16.67,
    color: "color-mix(in srgb, var(--on-contrast) 75%, transparent)",
  },
  {
    category: "Foundation",
    percent: 16.67,
    color: "color-mix(in srgb, var(--on-contrast) 60%, transparent)",
  },
  {
    category: "Validators",
    percent: 16.67,
    color: "color-mix(in srgb, var(--on-contrast) 45%, transparent)",
  },
  {
    category: "Ecosystem",
    percent: 16.67,
    color: "color-mix(in srgb, var(--on-contrast) 30%, transparent)",
  },
  {
    category: "Community",
    percent: 16.65,
    color: "color-mix(in srgb, var(--on-contrast) 18%, transparent)",
  },
]

// Standard treasury allocation buckets for a crypto raise. Categories
// are industry-standard; percentages placeholder (equal split signals
// not-yet-finalized).
export const treasury: TreasuryRow[] = [
  {
    category: "Development",
    percent: 25,
    note: "TBD",
    color: "color-mix(in srgb, var(--on-contrast) 100%, transparent)",
  },
  {
    category: "Ecosystem & liquidity",
    percent: 25,
    note: "TBD",
    color: "color-mix(in srgb, var(--on-contrast) 70%, transparent)",
  },
  {
    category: "Operations",
    percent: 25,
    note: "TBD",
    color: "color-mix(in srgb, var(--on-contrast) 45%, transparent)",
  },
  {
    category: "Reserves & runway",
    percent: 25,
    note: "TBD",
    color: "color-mix(in srgb, var(--on-contrast) 22%, transparent)",
  },
]
