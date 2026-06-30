import type { Config } from "@netlify/edge-functions"

/**
 * Edge rate-limit for the abuse-sensitive authenticated Sonar routes
 * (pre-purchase, generate-permit, entity, my-position, limits) - the ones that burn Sonar
 * quota; the permit routes also write audit rows. Netlify enforces the `rateLimit`
 * config below at the edge, before this handler: past the limit it returns HTTP 429
 * and the request never reaches Next.js; under the limit this empty handler returns
 * nothing and the request passes through unchanged.
 *
 * Limit: 10 req/min/IP. (OAuth init has its own tighter 3/min cap in
 * auth-init-rate-limit.ts.) This is coarse cross-instance abuse protection; it
 * complements, not replaces, the per-wallet permit dedup (lib/sonar/permit.ts) and
 * the authoritative on-chain replay guard (single-use + ECDSA + expiry). Verified
 * Netlify API: docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting.
 *
 * /api/sonar/commitments is deliberately NOT covered: it is public, cached, and
 * polled every ~10s (~6 req/min per open tab), so a 10/min IP cap would throttle
 * legitimate multi-tab / shared-NAT reads. The limit cannot live in netlify.toml -
 * Netlify rate limits are edge-function-only, hence this file.
 *
 * Caveat: per-IP aggregation can over-throttle shared NAT, and composition with
 * @netlify/plugin-nextjs on the same path is unverified - check on a deploy-preview
 * (or `netlify dev`) that 429s fire past the limit and normal requests still reach
 * the route.
 */
export default async () => {
  // Passthrough; the limit is enforced declaratively by `config` below.
  return undefined
}

export const config: Config = {
  path: [
    "/api/sonar/pre-purchase",
    "/api/sonar/generate-permit",
    "/api/sonar/entity",
    "/api/sonar/my-position",
    "/api/sonar/limits",
  ],
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
}
