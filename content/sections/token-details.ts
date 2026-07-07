/**
 * Content data for the Token details section.
 *
 * Section copy for the build (dev-facing).
 */

import { SALE_ECONOMICS, formatSaleDate } from "../../lib/sale/economics"

export type PositionMetric = {
  icon: string
  value: string
  label: string
  /** Render the value as a status dot + word (Active / Outbid) instead of a figure. */
  badge?: boolean
}

export const positionMetricsEmpty: PositionMetric[] = [
  { icon: "database", value: "-", label: "USD committed" },
  { icon: "line-chart", value: "-", label: "Bid price" },
  { icon: "cube", value: "-", label: "GNOT allocation" },
  { icon: "progress-ring", value: "-", label: "Status", badge: true },
]

export const positionMetricsActive: PositionMetric[] = [
  { icon: "database", value: "$3,200", label: "USD committed" },
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
      { label: "Sale allocation", value: "38,760,000 GNOT (~2.9% of supply)" },
      { label: "Sale format", value: "Uniform Price Auction (English Auction)" },
      { label: "Accepted currency", value: "USDC & USDT (Ethereum Mainnet)" },
      {
        label: "Contribution window",
        value: `${formatSaleDate(SALE_ECONOMICS.saleOpensIso, false)} - ${formatSaleDate(SALE_ECONOMICS.saleClosesIso)}`,
      },
      { label: "Expected mainnet launch", value: "Q3 2026" },
    ],
  },
  {
    eyebrow: "Pricing and Caps",
    rows: [
      { label: "Starting price", value: "$0.0645 per GNOT" },
      { label: "Bid increment", value: "$0.0215" },
      { label: "Minimum commitment", value: "$100" },
      { label: "Soft cap", value: `$${SALE_ECONOMICS.softCapUsd.toLocaleString("en-US")}` },
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
