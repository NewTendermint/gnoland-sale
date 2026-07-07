// Whether the /dev/states design gallery is reachable. Local dev always; deployed contexts only
// when NEXT_PUBLIC_DEV_STATES_ENABLED=1 (set for the staging branch-deploy in netlify.toml,
// never in production). The gallery renders mock fixtures only - no live overrides, no secrets.
export function stateOverridesEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEV_STATES_ENABLED === "1"
}
