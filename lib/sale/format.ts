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

/**
 * Countdown remainder as compact ticking digits: "32d 14:03:27" (days + a zero-padded
 * HH:MM:SS clock), dropping the day prefix under 24h ("14:03:27"). Pass withSeconds=false
 * for a calmer "32d 14:03" used on the compact mobile bar. The fixed-width clock +
 * tabular-nums at the call site keep layout stable while it ticks. Clamps at zero once
 * the target has passed.
 */
export const fmtCountdown = (msLeft: number, withSeconds = true) => {
  const total = Math.max(0, Math.floor(msLeft / 1000))
  const days = Math.floor(total / 86_400)
  const pad = (n: number) => String(n).padStart(2, "0")
  const hm = `${pad(Math.floor((total % 86_400) / 3_600))}:${pad(Math.floor((total % 3_600) / 60))}`
  const clock = withSeconds ? `${hm}:${pad(total % 60)}` : hm
  return days > 0 ? `${days}d ${clock}` : clock
}
