import { beforeEach, describe, expect, it, vi } from "vitest"

// SALE_CHAIN resolves NEXT_PUBLIC_SALE_CHAIN at module scope, so each case re-imports fresh.
async function saleChain() {
  const mod = await import("../../../lib/sale/contracts")
  return mod.SALE_CHAIN
}

async function contractsFor(chainId: number) {
  const mod = await import("../../../lib/sale/contracts")
  return mod.saleContractsFor(chainId)
}

// Deployed addresses pinned so an accidental map edit (wrong entry, swapped chains, dropped
// entry) fails here before it can ship. Prod address changes MUST update this test too.
const PROD_SETTLEMENT_SALE = "0x959f2ceE7B6C2095d228692eCb2E4744f2D3fDb4"
const SANDBOX_SETTLEMENT_SALE = "0x96e532431A8b0e7FCCDF7baFA3BDAc1B20de46B2"

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

describe("chain -> contract wiring (deployed addresses pinned)", () => {
  it("prod session (mainnet) resolves the prod SettlementSale", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "mainnet")
    const chain = await saleChain()
    expect((await contractsFor(chain.id))?.settlementSale).toBe(PROD_SETTLEMENT_SALE)
  })

  it("staging/preview/local session (sepolia) resolves the sandbox SettlementSale", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "sepolia")
    const chain = await saleChain()
    expect((await contractsFor(chain.id))?.settlementSale).toBe(SANDBOX_SETTLEMENT_SALE)
  })

  it("a misconfigured session (unset env) resolves the sandbox contract, never prod", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", undefined)
    const chain = await saleChain()
    const resolved = (await contractsFor(chain.id))?.settlementSale
    expect(resolved).toBe(SANDBOX_SETTLEMENT_SALE)
    expect(resolved).not.toBe(PROD_SETTLEMENT_SALE)
  })

  it("honors the sepolia address override without touching mainnet", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "sepolia")
    vi.stubEnv("NEXT_PUBLIC_SEPOLIA_SETTLEMENT_SALE", "0x000000000000000000000000000000000000dEaD")
    expect((await contractsFor(11155111))?.settlementSale).toBe(
      "0x000000000000000000000000000000000000dEaD",
    )
    expect((await contractsFor(1))?.settlementSale).toBe(PROD_SETTLEMENT_SALE)
  })

  it("returns undefined for any other chain (bids chain-blocked)", async () => {
    expect(await contractsFor(8453)).toBeUndefined()
    expect(await contractsFor(0)).toBeUndefined()
  })
})
