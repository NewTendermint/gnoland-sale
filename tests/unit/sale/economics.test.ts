import { afterEach, describe, expect, it, vi } from "vitest"

// minCommitmentUsd is resolved at module init, so each case re-imports a fresh module.
async function loadMinCommitment(chain: string, override: string): Promise<number> {
  vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", chain)
  vi.stubEnv("NEXT_PUBLIC_MIN_COMMITMENT_USD", override)
  vi.resetModules()
  const { SALE_ECONOMICS } = await import("../../../lib/sale/economics")
  return SALE_ECONOMICS.minCommitmentUsd
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("SALE_ECONOMICS.minCommitmentUsd (mainnet floor guard)", () => {
  it("ignores the override on mainnet", async () => {
    expect(await loadMinCommitment("mainnet", "2")).toBe(100)
  })

  it("honors the override on sepolia (staging/local)", async () => {
    expect(await loadMinCommitment("sepolia", "2")).toBe(2)
  })

  it("treats an unset chain as sepolia (fail-safe default): override honored", async () => {
    expect(await loadMinCommitment("", "2")).toBe(2)
  })

  it("refuses an unknown chain at import instead of assuming mainnet", async () => {
    await expect(loadMinCommitment("base", "2")).rejects.toThrow(/NEXT_PUBLIC_SALE_CHAIN/)
  })

  it("falls back to $100 off-mainnet when the override is unset", async () => {
    expect(await loadMinCommitment("sepolia", "")).toBe(100)
  })
})
