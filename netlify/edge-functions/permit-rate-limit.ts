import type { Config } from "@netlify/edge-functions"

/**
 * Tight edge cap for the permit path: these routes burn Sonar quota and write audit rows, and a
 * real bid attempt uses ~2 of them - 10/min/IP caps abuse without touching legitimate bidding.
 * Coarse cross-instance protection; complements, not replaces, the per-wallet permit dedup
 * (lib/sonar/permit.ts) and the authoritative on-chain replay guard (single-use + ECDSA + expiry).
 */
export default async () => {
  // Passthrough; the limit is enforced declaratively by `config` below.
  return undefined
}

export const config: Config = {
  path: ["/api/sonar/pre-purchase", "/api/sonar/generate-permit"],
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip"],
  },
}
