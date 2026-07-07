import "server-only"

/**
 * Dev-only Sonar mock switch (injects fixtures at the Sonar boundary). Off in
 * production, and fail-closed to the sepolia sandbox: any other SALE_CHAIN
 * (mainnet, a typo) disables the mock.
 */
// Raw process.env on purpose: importing the validated `env` would couple this dev-only
// seam (and its tests) to the full boot schema.
export function sonarMockEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false
  if ((process.env.SALE_CHAIN ?? "sepolia") !== "sepolia") return false // unset = sepolia (lib/env.ts default)
  return process.env.SONAR_MOCK === "1"
}
