// Whether the state-preview surface (?phase/?journey overrides, /dev/states) is active.
// NEXT_PUBLIC_STATE_OVERRIDES must NEVER be set on the production context once the sale
// is public - the live page's phase must not be flippable from a crafted link.
export function stateOverridesEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_STATE_OVERRIDES === "1") return true
  return process.env.NODE_ENV !== "production"
}
