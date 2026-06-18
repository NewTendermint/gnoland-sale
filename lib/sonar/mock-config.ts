import "server-only"

/**
 * Dev-only Sonar mock switch (injects fixtures at the Sonar boundary). Two guards
 * keep mock data off a real sale: off in production, AND off when SALE_CHAIN=mainnet.
 */
export function sonarMockEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false
  if (process.env.SALE_CHAIN === "mainnet") return false
  return process.env.SONAR_MOCK === "1"
}
