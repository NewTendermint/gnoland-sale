import "server-only"

const ENDPOINT = "https://test13.api.onbloc.xyz/v1/stats/summary/transactions"
// Shown if the third-party stats API is unreachable, so the page never breaks or blocks on it.
const FALLBACK = "680K+"
// ISR: cached and revalidated in the background every 2h on the next request (traffic-triggered,
// no cron). Server-side only - no client fetch, so no CSP/connect-src or visitor-privacy impact.
const REVALIDATE_S = 2 * 60 * 60

// One decimal, floored so the "+" never overstates, with a trailing ".0" dropped (688 -> "688",
// 3.1 -> "3.1", 3.0 -> "3").
function floorOneDecimal(x: number): string {
  const v = Math.floor(x * 10) / 10
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

/** Compact, "+"-suffixed count matching the stats grid style, keeping one decimal of nuance
 *  (688024 -> "688K+", 3150000 -> "3.1M+", 1900000 -> "1.9M+"). */
export function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${floorOneDecimal(n / 1_000_000)}M+`
  if (n >= 1_000) return `${floorOneDecimal(n / 1_000)}K+`
  return `${n}+`
}

/** Live Test13 transaction count for the stats grid, formatted; falls back to a static string on
 *  any failure (unreachable, non-2xx, unexpected shape). */
export async function fetchTest13Transactions(): Promise<string> {
  try {
    const res = await fetch(ENDPOINT, { next: { revalidate: REVALIDATE_S } })
    if (!res.ok) return FALLBACK
    const json: unknown = await res.json()
    const total = (json as { data?: { data?: { total?: unknown } } })?.data?.data?.total
    if (typeof total !== "number" || !Number.isFinite(total) || total <= 0) return FALLBACK
    return formatCompactCount(total)
  } catch {
    return FALLBACK
  }
}
