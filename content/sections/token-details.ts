/**
 * Content data for the Token details section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing).
 */

export type PositionMetric = {
  icon: string
  value: string
  label: string
  /** Render the value as a status dot + word (Active / Outbid) instead of a figure. */
  badge?: boolean
}

export const positionMetricsEmpty: PositionMetric[] = [
  { icon: "database", value: "-", label: "USDC committed" },
  { icon: "line-chart", value: "-", label: "Bid price" },
  { icon: "cube", value: "-", label: "GNOT allocation" },
  { icon: "progress-ring", value: "-", label: "Status", badge: true },
]

export const positionMetricsActive: PositionMetric[] = [
  { icon: "database", value: "$3,200", label: "USDC committed" },
  { icon: "line-chart", value: "$0.18", label: "Bid price" },
  { icon: "cube", value: "20,000", label: "GNOT allocation" },
  { icon: "progress-ring", value: "Active", label: "Status", badge: true },
]

export const termGroups: Array<{
  eyebrow: string
  rows: Array<{ label: string; value: string; tbd?: boolean; href?: string }>
}> = [
  {
    eyebrow: "Sale Overview",
    rows: [
      { label: "Token", value: "GNOT" },
      { label: "Sale allocation", value: "77,500,000 GNOT (~5.8% of supply)" },
      { label: "Sale format", value: "Uniform Price Auction (English Auction)" },
      { label: "Accepted currency", value: "USDC (Ethereum Mainnet)" },
      { label: "Contribution window", value: "July 15 - July 21, 2026" },
      { label: "Expected mainnet launch", value: "Q3 2026" },
    ],
  },
  {
    eyebrow: "Pricing and Caps",
    rows: [
      { label: "Starting price", value: "$0.0645 per GNOT" },
      { label: "Max price", value: "$0.129 per GNOT" },
      { label: "Bid increment", value: "$0.00645" },
      { label: "Minimum commitment", value: "$100" },
      { label: "Soft cap", value: "$2,000,000" },
      { label: "Hard cap", value: "$10,000,000" },
    ],
  },
]

// Rendered as two large inline links below the terms table, not as a term group.
export const documents: Array<{ label: string; value: string; href: string }> = [
  {
    label: "Audit",
    value: "GnoVM · Oak Security Audit",
    href: "https://github.com/oak-security/audit-reports/tree/main/Gno",
  },
  {
    label: "Disclosure",
    value: "Token Disclosure Document",
    href: "#token-disclosure",
  },
]
