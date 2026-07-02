import type { Config } from "@netlify/edge-functions"

/**
 * Edge cap for the push-subscribe write. A session is cheap to mint (init) and one row is stored per
 * POST, so an unthrottled route lets an attacker flood the table; the outbid cron then loads every
 * row. A real user subscribes rarely (opt-in plus a few bid-limit re-syncs), so 10/min/IP stops a
 * flood without touching legitimate use. The endpoint host allowlist (lib/db/schema.ts) is the
 * paired defense against SSRF/amplification. Same validate-on-deploy-preview caveat as the other
 * limiters (composition with @netlify/plugin-nextjs on the same path is unverified locally).
 */
export default async () => {
  // Passthrough; the limit is enforced declaratively by `config` below.
  return undefined
}

export const config: Config = {
  path: "/api/push/subscribe",
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
}
