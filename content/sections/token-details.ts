/**
 * Content data for the Token details section.
 *
 * Section copy for the build (dev-facing).
 */

import { SALE_ECONOMICS } from "../../lib/sale/economics"

export type PositionMetric = {
  /** Stable id, keys into the "TokenDetails" message namespace (metric.<id>). */
  id: string
  icon: string
  value: string
  /** Render the value as a status dot + word (Active / Outbid) instead of a figure. */
  badge?: boolean
}

export const positionMetricsEmpty: PositionMetric[] = [
  { id: "committed", icon: "database", value: "-" },
  { id: "bidPrice", icon: "line-chart", value: "-" },
  { id: "allocation", icon: "cube", value: "-" },
  { id: "status", icon: "progress-ring", value: "-", badge: true },
]

export const positionMetricsActive: PositionMetric[] = [
  { id: "committed", icon: "database", value: "$3,200" },
  { id: "bidPrice", icon: "line-chart", value: "$0.18" },
  { id: "allocation", icon: "cube", value: "20,000" },
  { id: "status", icon: "progress-ring", value: "Active", badge: true },
]

/**
 * Terms table groups.
 *
 * `id` keys into the "TokenDetails" message namespace: the group eyebrow is
 * `<groupId>.eyebrow`, each row label is `<groupId>.<rowId>.label`, and prose
 * row values are `<groupId>.<rowId>.value`. Rows that carry a `value` here hold
 * a computed or numeric-only figure (dates/amounts) that stays in code; those
 * without a `value` read their prose text from the message catalog.
 */
export type TermRow = { id: string; value?: string; tbd?: boolean; href?: string }

export const termGroups: Array<{ id: string; rows: TermRow[] }> = [
  {
    id: "saleOverview",
    rows: [
      { id: "token", value: "GNOT" },
      { id: "saleAllocation" },
      { id: "saleFormat" },
      { id: "acceptedCurrency" },
      // value is the sale-open..close date range, computed locale-aware in TokenDetails.tsx and
      // injected into the "{range}" placeholder of the message.
      { id: "contributionWindow" },
      { id: "mainnetLaunch" },
      // Promo row, filtered out at render unless the first-day bonus is surfaced
      // (firstDayBonusEnabled, applied in TokenDetails.tsx).
      { id: "firstDayBonus" },
    ],
  },
  {
    id: "pricingCaps",
    rows: [
      { id: "startingPrice" },
      { id: "bidIncrement", value: "$0.0215" },
      { id: "minCommitment", value: "$100" },
      { id: "softCap", value: `$${SALE_ECONOMICS.softCapUsd.toLocaleString("en-US")}` },
    ],
  },
]

// Rendered as two large inline links below the terms table, not as a term group.
// `id` keys into the "TokenDetails" message namespace (documents.<id>.value).
export const documents: Array<{ id: string; href: string; download?: boolean }> = [
  {
    id: "audit",
    href: "https://github.com/oak-security/audit-reports/tree/main/Gno",
  },
  {
    id: "disclosure",
    href: "/docs/gnot-token-sale-disclosure.pdf",
    download: true,
  },
]
