/**
 * Structural data for the How it works steps: stable `id` (keys the "HowItWorks.steps" message
 * namespace, translated per locale) + presentational `icon`. Step title/body copy lives in the
 * message catalogs.
 */

export const steps: Array<{ id: string; icon: string }> = [
  { id: "verify", icon: "shield-check" },
  { id: "connect", icon: "wallet" },
  { id: "bid", icon: "scale" },
  { id: "receive", icon: "send" },
]
