import type { Config } from "@netlify/edge-functions"

/**
 * Edge rate-limit for the abuse-sensitive authenticated Sonar routes (pre-purchase,
 * generate-permit, entity) - the ones that burn Sonar quota (the permit routes also
 * write audit rows). Netlify
 * enforces the `rateLimit` config below AT THE EDGE, before this handler: past the
 * limit it returns HTTP 429 ("block", the default) and the request never reaches
 * Next.js; under the limit this empty handler returns nothing, so the request
 * passes through to the Next.js route handler unchanged.
 *
 * Limit per ADR 4.5: 10 req/min/IP. (OAuth init has its own tighter 3/min cap in
 * auth-init-rate-limit.ts.) This is COARSE cross-instance abuse protection; it
 * complements, not replaces, the per-wallet permit dedup (lib/sonar/permit.ts) and
 * the authoritative on-chain replay guard (single-use + ECDSA + expiry). Verified
 * Netlify API: docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting.
 *
 * DEVIATION FROM ADR 4.5 (flagged): the ADR wrote "/api/sonar/* = 10/min", which
 * would include /api/sonar/commitments. That route is public, cached, and polled
 * every ~10s (about 6 req/min per open tab), so a 10/min IP cap would throttle
 * legitimate multi-tab / shared-NAT reads. It is therefore the one /api/sonar/*
 * route EXCLUDED here; /api/sonar/entity (also authenticated, also burns Sonar
 * quota) IS covered above. Confirm
 * this exclusion, or revert to the literal ADR scope. (The ADR also said to add the
 * block to netlify.toml; verified NOT possible - Netlify rate limits are
 * edge-function-only - hence this file.)
 *
 * TUNE / VALIDATE: per-IP aggregation can over-throttle shared NAT. And Netlify's
 * docs do not confirm composition with @netlify/plugin-nextjs on the same path -
 * validate on a deploy-preview (or `netlify dev`) that 429s fire past the limit AND
 * normal requests still reach the route.
 */
export default async () => {
  // Passthrough; the limit is enforced declaratively by `config` below.
  return undefined
}

export const config: Config = {
  path: ["/api/sonar/pre-purchase", "/api/sonar/generate-permit", "/api/sonar/entity"],
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
}
