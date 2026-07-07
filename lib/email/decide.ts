// Pure trigger for the price email cron: send only on a RISE since the last email, at most
// once per cooldown. First run records a baseline so a fresh deploy never emails.
export const COOLDOWN_MS = 24 * 60 * 60 * 1000

export type DecideInput = {
  clearingPriceUsd: number
  lastSentPriceUsd: number | null
  lastSentAtMs: number | null
  nowMs: number
}

export type Decision =
  | { action: "send" }
  | { action: "skip"; reason: "first-run-baseline" | "price-not-higher" | "cooldown" }

export function decidePriceEmail(input: DecideInput): Decision {
  if (input.lastSentPriceUsd == null) return { action: "skip", reason: "first-run-baseline" }
  if (input.clearingPriceUsd <= input.lastSentPriceUsd)
    return { action: "skip", reason: "price-not-higher" }
  if (input.lastSentAtMs != null && input.nowMs - input.lastSentAtMs < COOLDOWN_MS)
    return { action: "skip", reason: "cooldown" }
  return { action: "send" }
}
