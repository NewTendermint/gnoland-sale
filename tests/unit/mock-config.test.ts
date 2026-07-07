import { afterEach, describe, expect, it, vi } from "vitest"
import { sonarMockEnabled } from "../../lib/sonar/mock-config"

// The single most safety-critical boolean: mock data / the auth-bypass dummy
// token must NEVER be reachable on a real ($2M mainnet) deployment.
afterEach(() => {
  vi.unstubAllEnvs()
})

describe("sonarMockEnabled (prod-safety guard)", () => {
  it("is ON only in non-production, non-mainnet, with the flag set", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("SALE_CHAIN", "sepolia")
    vi.stubEnv("SONAR_MOCK", "1")
    expect(sonarMockEnabled()).toBe(true)
  })

  it("is OFF in production even with SONAR_MOCK=1", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("SALE_CHAIN", "sepolia")
    vi.stubEnv("SONAR_MOCK", "1")
    expect(sonarMockEnabled()).toBe(false)
  })

  it("is OFF against mainnet (SALE_CHAIN=mainnet) even with SONAR_MOCK=1", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("SALE_CHAIN", "mainnet")
    vi.stubEnv("SONAR_MOCK", "1")
    expect(sonarMockEnabled()).toBe(false)
  })

  it("fails closed on an unknown or typo'd SALE_CHAIN", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("SONAR_MOCK", "1")
    for (const chain of ["mainnett", "base-sepolia", ""]) {
      vi.stubEnv("SALE_CHAIN", chain)
      expect(sonarMockEnabled()).toBe(false)
    }
  })

  it("is OFF when the flag is absent or not exactly '1'", () => {
    vi.stubEnv("NODE_ENV", "development")
    vi.stubEnv("SALE_CHAIN", "sepolia")
    expect(sonarMockEnabled()).toBe(false)
    vi.stubEnv("SONAR_MOCK", "true")
    expect(sonarMockEnabled()).toBe(false)
  })
})
