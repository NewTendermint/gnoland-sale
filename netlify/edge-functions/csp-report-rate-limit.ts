import type { Config } from "@netlify/edge-functions"

/**
 * Edge cap for the CSP report receiver - an unauthenticated write by design (browsers POST
 * violation reports without credentials), so it needs the same edge throttle as the other open
 * routes. A single page load can legitimately emit a burst of reports (one per violated
 * directive), so the window is wider than the human-action limiters. Same
 * validate-on-deploy-preview caveat as the other limiters.
 */
export default async () => {
  // Passthrough; the limit is enforced declaratively by `config` below.
  return undefined
}

export const config: Config = {
  path: "/api/csp-report",
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
}
