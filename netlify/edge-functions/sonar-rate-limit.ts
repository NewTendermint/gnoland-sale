import type { Config } from "@netlify/edge-functions"

/**
 * Edge rate-limit for the authenticated Sonar READ routes (entity, my-position). Both fire on
 * every page load (plus client retries), so the cap must absorb bursts of legitimate reloads -
 * an undersized shared bucket reads as "reconnect to Sonar" while the session is valid. Past the
 * limit Netlify answers 429 at the edge (the request never reaches Next.js); the client backs
 * off until the window resets (lib/sale/query-retry.ts).
 *
 * The quota-sensitive permit routes have a tighter cap in permit-rate-limit.ts; OAuth init has
 * its own in auth-init-rate-limit.ts. /api/sonar/commitments is deliberately NOT covered: it is
 * public, cached, and polled every ~10s. Limits cannot live in netlify.toml - Netlify rate
 * limits are edge-function-only. Docs: docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting.
 *
 * FOOTGUN: aggregateBy ip over-throttles shared NAT - size for N users behind one IP, not one.
 */
export default async () => {
  // Passthrough; the limit is enforced declaratively by `config` below.
  return undefined
}

export const config: Config = {
  path: ["/api/sonar/entity", "/api/sonar/my-position"],
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
}
