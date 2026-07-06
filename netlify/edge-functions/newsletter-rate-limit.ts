import type { Config } from "@netlify/edge-functions"

/**
 * Edge cap for the newsletter subscribe write, aligned with the other unauthenticated writes
 * (permit/auth-init/push-subscribe). The route keeps its own per-instance in-memory window
 * as defense in depth, but that one resets per lambda instance and cannot stop a distributed
 * flood; this cap is enforced at the edge before Next.js runs. A real user subscribes once
 * (maybe retries a typo), so 5/min/IP is generous. Same validate-on-deploy-preview caveat as the
 * other limiters (composition with @netlify/plugin-nextjs on the same path is unverified locally).
 */
export default async () => {
  // Passthrough; the limit is enforced declaratively by `config` below.
  return undefined
}

export const config: Config = {
  path: "/api/newsletter",
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
}
