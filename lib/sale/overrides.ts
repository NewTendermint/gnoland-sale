// Whether the /dev/states design gallery is reachable. Local dev only: there are no live-page
// phase overrides anymore, so this is purely a local tool, never exposed on a deploy.
export function stateOverridesEnabled(): boolean {
  return process.env.NODE_ENV !== "production"
}
