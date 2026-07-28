import { beforeEach, describe, expect, it, vi } from "vitest"

// The gate reads env.CRON_SECRET, so each case needs its own module registry.
async function loadGate(secret: string | undefined) {
  vi.resetModules()
  vi.doMock("../../../lib/env", () => ({ env: { CRON_SECRET: secret } }))
  return (await import("../../../lib/security/cron-auth")).cronAuthFailure
}

function withAuth(header: string | undefined): Request {
  return new Request("https://sale.gno.land/api/push/cron", {
    method: "POST",
    headers: header ? { authorization: header } : {},
  })
}

/**
 * One gate guards all four scheduled routes (db cleanup, push cron, email cron,
 * attribution reconcile), so these three cases cover every one of them.
 */
describe("cronAuthFailure", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it("authorizes the exact bearer", async () => {
    const gate = await loadGate("s3cret")
    expect(gate(withAuth("Bearer s3cret"))).toBeNull()
  })

  // Surrounding whitespace never reaches the gate: the Fetch spec trims header
  // values, so this arrives already normalized rather than as a near-miss.
  it("authorizes a bearer the platform normalizes", async () => {
    const gate = await loadGate("s3cret")
    expect(gate(withAuth("Bearer s3cret "))).toBeNull()
  })

  it("401s a wrong, malformed or absent bearer", async () => {
    const gate = await loadGate("s3cret")
    for (const header of ["Bearer wrong", "Bearer s3cre", "bearer s3cret", "s3cret", undefined]) {
      const res = gate(withAuth(header))
      expect(res?.status, `header: ${header}`).toBe(401)
      await expect(res?.json()).resolves.toEqual({ error: "unauthorized" })
    }
  })

  // The kill-switch must not become an open door: with no secret configured there is
  // no value a caller could present, so every request has to be refused.
  it("fails closed when CRON_SECRET is unset, including for a bare `Bearer`", async () => {
    const gate = await loadGate(undefined)
    for (const header of ["Bearer anything", "Bearer ", "Bearer", undefined]) {
      expect(gate(withAuth(header))?.status, `header: ${header}`).toBe(401)
    }
  })
})
