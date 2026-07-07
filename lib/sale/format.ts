// Shared USD / number formatters for the sale UI.

/** Parse a user-typed decimal, accepting the EU comma-decimal and US comma-grouping. */
export function parseDecimal(v: string): number {
  return Number(normalizeComma(v))
}

// "," is the EU decimal key but a grouping separator in "1,000" / "1,234.56": grouping
// when a dot coexists, several commas appear, or a lone comma ends in exactly 3 digits.
function normalizeComma(v: string): string {
  const commas = v.split(",").length - 1
  if (commas === 0) return v
  if (commas > 1 || v.includes(".")) return v.replaceAll(",", "")
  const [int = "", frac = ""] = v.split(",")
  return frac.length === 3 && /[1-9]/.test(int) ? v.replace(",", "") : v.replace(",", ".")
}

/** Price with 2-4 decimals, e.g. "$0.12" / "$0.0645". */
export const fmtPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`

/** Whole-dollar USD amount, e.g. "$3,200". */
export const fmtUsd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`

// Pending-chip copy. Single source for the live bar AND the /dev/states gallery (this module is
// server-importable, unlike the client metric components). Rendered as an inline capsule after
// the Committed label only; the tooltip (PENDING_CHIP_HINT) spells out the indexing lag.
export const pendingCommittedChip = (amountUsd: number) => `+${fmtUsd(amountUsd)} pending`
export const PENDING_CHIP_HINT = "Confirmed on-chain, not yet indexed"

/** Compact number, e.g. "721K" / "1.2M" (deterministic across JS engines, unlike Intl compact).
 * One decimal from millions up only; K amounts round to a whole number. */
export const fmtCompact = (n: number) => {
  const sign = n < 0 ? "-" : ""
  const abs = Math.abs(n)
  if (abs < 1000) return `${sign}${Math.round(abs)}`
  const units = ["K", "M", "B", "T"]
  let v = abs
  let i = -1
  while (v >= 1000 && i < units.length - 1) {
    v /= 1000
    i++
  }
  let rounded = i === 0 ? Math.round(v) : Math.round(v * 10) / 10
  if (rounded >= 1000 && i < units.length - 1) {
    rounded /= 1000
    i++
  }
  return `${sign}${rounded}${units[i]}`
}

/** Compact USD, e.g. "$721K" / "$1.2M". */
export const fmtCompactUsd = (n: number) => (n < 0 ? `-$${fmtCompact(-n)}` : `$${fmtCompact(n)}`)

/** Plain count, e.g. "1,247". */
export const fmtCount = (n: number) => n.toLocaleString("en-US")

/** Whole GNOT token count, e.g. "26,667". */
export const fmtGnot = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 })

/** Countdown remainder, e.g. "32d 14:03:27" (drops day prefix under 24h); clamps at zero. */
export const fmtCountdown = (msLeft: number, withSeconds = true) => {
  const total = Math.max(0, Math.floor(msLeft / 1000))
  const days = Math.floor(total / 86_400)
  const pad = (n: number) => String(n).padStart(2, "0")
  const hm = `${pad(Math.floor((total % 86_400) / 3_600))}:${pad(Math.floor((total % 3_600) / 60))}`
  const clock = withSeconds ? `${hm}:${pad(total % 60)}` : hm
  return days > 0 ? `${days}d ${clock}` : clock
}
