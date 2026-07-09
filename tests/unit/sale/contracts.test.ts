import { beforeEach, describe, expect, it, vi } from "vitest"

// SALE_CHAIN resolves NEXT_PUBLIC_SALE_CHAIN at module scope, so each case re-imports fresh.
async function saleChain() {
  const mod = await import("../../../lib/sale/contracts")
  return mod.SALE_CHAIN
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
})

describe("SALE_CHAIN client selector", () => {
  it("resolves sepolia when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "sepolia")
    expect((await saleChain()).id).toBe(11155111)
  })

  it("resolves mainnet when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "mainnet")
    expect((await saleChain()).id).toBe(1)
  })

  it("defaults to sepolia when unset (fail-safe: mainnet only by explicit opt-in)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", undefined)
    expect((await saleChain()).id).toBe(11155111)
  })

  it("treats an empty value as unset (Netlify empty var)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "")
    expect((await saleChain()).id).toBe(11155111)
  })

  // The failure this guards: any typo/case slip would fall through the default SILENTLY - the
  // client would frame one chain while the server (z.enum, fail-closed) audits another. Unknown
  // set values must fail the build, never pick a chain.
  it("throws at import on an unknown value instead of silently picking a chain", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "Sepolia")
    await expect(saleChain()).rejects.toThrow(/NEXT_PUBLIC_SALE_CHAIN/)
    vi.resetModules()
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "mainet")
    await expect(saleChain()).rejects.toThrow(/NEXT_PUBLIC_SALE_CHAIN/)
  })

  it("rejects prototype-chain keys too (Object.hasOwn, not `in`)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "toString")
    await expect(saleChain()).rejects.toThrow(/NEXT_PUBLIC_SALE_CHAIN/)
  })
})
