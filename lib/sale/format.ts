/**
 * Shared USD / number formatters for the sale UI. Single source so a formatting
 * change is one edit (previously duplicated across BidPanel / BidFlow / dev harness).
 */

/** Price with 2-4 decimals, e.g. "$0.12" / "$0.0645". */
export const fmtPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`

/** Whole-dollar USD amount, e.g. "$3,200". */
export const fmtUsd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`

/** Compact USD, e.g. "$1.2M". */
export const fmtCompactUsd = (n: number) =>
  n.toLocaleString("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  })

/** Plain count, e.g. "1,247". */
export const fmtCount = (n: number) => n.toLocaleString("en-US")

/** Whole GNOT token count, e.g. "26,667". */
export const fmtGnot = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 })
