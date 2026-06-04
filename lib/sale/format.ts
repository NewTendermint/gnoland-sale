/**
 * Shared USD / number formatters for the sale UI. Single source so a formatting
 * change is one edit.
 */

/** Price with 2-4 decimals, e.g. "$0.12" / "$0.0645". */
export const fmtPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`

/** Whole-dollar USD amount, e.g. "$3,200". */
export const fmtUsd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`

/**
 * Compact USD, e.g. "$1.2M". Hand-rolled because Intl `notation: "compact"` is
 * not deterministic across JS engines. One decimal; a rounding carry promotes to
 * the next unit (e.g. 999_960 becomes "$1M").
 */
export const fmtCompactUsd = (n: number) => {
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)
  if (abs < 1000) return `${sign}$${Math.round(abs)}`
  const units = ["K", "M", "B", "T"]
  let v = abs
  let i = -1
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  let rounded = Math.round(v * 10) / 10
  if (rounded >= 1000 && i < units.length - 1) {
    rounded /= 1000
    i++
  }
  return `${sign}$${rounded}${units[i]}`
}

/** Plain count, e.g. "1,247". */
export const fmtCount = (n: number) => n.toLocaleString("en-US")

/** Whole GNOT token count, e.g. "26,667". */
export const fmtGnot = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 })
