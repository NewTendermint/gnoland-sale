/**
 * Content data for the Token details section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing).
 */

export const positionMetricsEmpty: Array<{ icon: string; value: string; label: string }> = [
  { icon: "database", value: "-", label: "My commitment" },
  { icon: "progress-ring", value: "-", label: "My filled" },
  { icon: "line-chart", value: "-", label: "My best bid" },
  { icon: "cube", value: "-", label: "My GNOT estimate" },
]

export const positionMetricsActive: Array<{ icon: string; value: string; label: string }> = [
  { icon: "database", value: "$3,200", label: "My commitment" },
  { icon: "progress-ring", value: "75%", label: "My filled" },
  { icon: "line-chart", value: "$0.18", label: "My best bid" },
  { icon: "cube", value: "20,000", label: "My GNOT estimate" },
]

export const termGroups: Array<{
  eyebrow: string
  rows: Array<{ label: string; value: string; tbd?: boolean }>
}> = [
  {
    eyebrow: "Token",
    rows: [
      { label: "Token", value: "GNOT" },
      { label: "Format", value: "Uniform Price Auction (English Auction)" },
      { label: "Currencies", value: "USDC, USDT (on Base)" },
    ],
  },
  {
    eyebrow: "Supply",
    rows: [
      { label: "Max supply", value: "TBD", tbd: true },
      { label: "Circulating at TGE", value: "TBD", tbd: true },
      { label: "Target raise", value: "TBD", tbd: true },
      { label: "FDV at clearing", value: "TBD", tbd: true },
    ],
  },
  {
    eyebrow: "Bid range",
    rows: [
      { label: "Minimum price", value: "TBD", tbd: true },
      { label: "Min commitment", value: "TBD", tbd: true },
      { label: "Max commitment", value: "TBD", tbd: true },
    ],
  },
  {
    eyebrow: "Schedule",
    rows: [
      { label: "Contribution window", value: "TBD", tbd: true },
      { label: "Mainnet launch", value: "Q1 2026 Beta · Q3 2026 Mainnet" },
    ],
  },
  {
    eyebrow: "Security",
    rows: [
      { label: "Sale contract", value: "TBD", tbd: true },
      { label: "Audit", value: "TBD", tbd: true },
      { label: "Multisig", value: "TBD", tbd: true },
      { label: "Treasury custody", value: "TBD", tbd: true },
    ],
  },
]
