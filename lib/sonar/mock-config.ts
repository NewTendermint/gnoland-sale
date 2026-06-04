import "server-only"

/**
 * Dev-only Sonar mock switch. When on, server code injects fixtures at the Sonar
 * boundary (fetch + token) instead of hitting the network/DB. Read at call time
 * (not cached) so tests can toggle it per case.
 *
 * Two independent guards make it impossible to serve mock data on a real sale,
 * even if one env var is misset: it is off in production, AND off whenever the
 * deployment targets mainnet (SALE_CHAIN=base). Both must be false-y and the
 * flag must be explicitly "1".
 */
export function sonarMockEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false
  if (process.env.SALE_CHAIN === "base") return false
  return process.env.SONAR_MOCK === "1"
}
