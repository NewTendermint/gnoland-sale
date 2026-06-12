/**
 * Whether the state-preview surface is active: the ?phase / ?registration /
 * ?journey URL overrides (SaleProvider) and the /dev/states harness.
 *
 * Development: always on. Production builds: only with the explicit
 * NEXT_PUBLIC_STATE_OVERRIDES=1 build-time flag - netlify.toml sets it for
 * deploy-preview and branch-deploy contexts so the team can review every state
 * on a shared URL. It must NEVER be set on the production context once the
 * sale is public (pre-launch hardening checklist): the live page's phase must
 * not be flippable from a crafted link.
 */
export function stateOverridesEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_STATE_OVERRIDES === "1") return true
  return process.env.NODE_ENV !== "production"
}
