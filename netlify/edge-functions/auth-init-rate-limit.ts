import type { Config } from "@netlify/edge-functions"

/**
 * Edge rate-limit for OAuth init (/api/auth/sonar/init), which mints PKCE state
 * into Netlify Blobs. A tighter cap than the permit routes: a legitimate user
 * starts login rarely, whereas spam would fill the PKCE store.
 *
 * Limit per ADR 4.5: 3 req/min/IP. Enforced at the edge (HTTP 429 "block" past the
 * limit, before Next.js); the empty handler passes allowed requests through. Same
 * tune-for-NAT and validate-on-deploy-preview caveats as sonar-rate-limit.ts.
 */
export default async () => {
  // Passthrough; the limit is enforced declaratively by `config` below.
  return undefined
}

export const config: Config = {
  path: "/api/auth/sonar/init",
  rateLimit: {
    windowLimit: 3,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
}
