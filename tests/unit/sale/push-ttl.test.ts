import { beforeEach, describe, expect, it, vi } from "vitest"

// pushTtlSeconds reads SALE_ECONOMICS, which is computed from env at module load - stub, reset,
// dynamic-import per test.
async function ttl(nowIso: string, capS: number, closesEnv?: string) {
  vi.resetModules()
  if (closesEnv !== undefined) vi.stubEnv("NEXT_PUBLIC_SALE_CLOSES", closesEnv)
  const { pushTtlSeconds } = await import("../../../lib/sale/live-window")
  return pushTtlSeconds(new Date(nowIso).getTime(), capS)
}

const CAP = 6 * 60 * 60

beforeEach(() => {
  vi.unstubAllEnvs()
})

describe("pushTtlSeconds", () => {
  it("caps at the ceiling when the close date is far away", async () => {
    expect(await ttl("2026-01-01T00:00:00Z", CAP, "2099-01-01T00:00:00Z")).toBe(CAP)
  })

  it("shrinks to the time remaining when the close date is nearer than the cap", async () => {
    expect(await ttl("2026-01-01T00:00:00Z", CAP, "2026-01-01T03:00:00Z")).toBe(3 * 60 * 60)
  })

  it("returns the cap when the close date has passed (chain-first caller may still be live: extension)", async () => {
    expect(await ttl("2026-01-02T00:00:00Z", CAP, "2026-01-01T00:00:00Z")).toBe(CAP)
  })

  it("returns the cap for a malformed close date instead of leaking NaN", async () => {
    expect(await ttl("2026-01-01T00:00:00Z", CAP, "not-a-date")).toBe(CAP)
  })
})
