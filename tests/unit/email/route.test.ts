import { beforeEach, describe, expect, it, vi } from "vitest"

const readCommitments = vi.fn()
const dbSelect = vi.fn()
const dbInsert = vi.fn()
vi.mock("@/lib/sonar/commitments", () => ({
  readCommitments: (...a: unknown[]) => readCommitments(...a),
}))
const saleIsLive = vi.fn()
// Mocked: the real saleIsLive would hit an RPC whenever a sandbox contract is configured.
vi.mock("@/lib/sale/live-window", () => ({
  saleIsLive: (...a: unknown[]) => saleIsLive(...a),
}))
const acquireCronLease = vi.fn()
const releaseCronLease = vi.fn()
vi.mock("@/lib/db/lease", () => ({
  CRON_LEASE_TTL_S: 240,
  acquireCronLease: (...a: unknown[]) => acquireCronLease(...a),
  releaseCronLease: (...a: unknown[]) => releaseCronLease(...a),
}))
vi.mock("@/lib/db/client", () => ({
  db: {
    select: () => ({ from: () => dbSelect() }),
    insert: () => ({
      values: (v: unknown) => ({ onConflictDoUpdate: (u: unknown) => dbInsert(v, u) }),
    }),
  },
}))
const sendPriceCampaign = vi.fn()
vi.mock("@/lib/newsletter/campaign", () => ({
  sendPriceCampaign: (...a: unknown[]) => sendPriceCampaign(...a),
}))

async function call(auth?: string) {
  const { POST } = await import("../../../app/api/email/cron/route")
  return POST(
    new Request("http://x/api/email/cron", {
      method: "POST",
      headers: auth ? { authorization: auth } : {},
    }),
  )
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.stubEnv("CRON_SECRET", "s3cret")
  // Sale window open around "now" for the gate.
  vi.stubEnv("NEXT_PUBLIC_SALE_OPENS", "2000-01-01T00:00:00Z")
  vi.stubEnv("NEXT_PUBLIC_SALE_CLOSES", "2100-01-01T00:00:00Z")
  readCommitments.mockReset()
  dbSelect.mockReset()
  dbInsert.mockReset()
  acquireCronLease.mockReset()
  acquireCronLease.mockResolvedValue(true)
  releaseCronLease.mockReset()
  sendPriceCampaign.mockReset()
  saleIsLive.mockReset()
  saleIsLive.mockResolvedValue(true)
})

describe("POST /api/email/cron", () => {
  it("401s without the bearer secret", async () => {
    const res = await call()
    expect(res.status).toBe(401)
  })

  it("skips outside the sale window, warning when the contract disagrees (schedule drift)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.stubEnv("NEXT_PUBLIC_SALE_OPENS", "2099-01-01T00:00:00Z")
    const res = await call("Bearer s3cret")
    expect(await res.json()).toEqual({ skipped: "not-live" })
    // saleIsLive is mocked true: the chain says live while the env dates say not - the skip is
    // the announced-window policy, but it must be LOUD so a drifted economics.ts gets noticed.
    expect(warnSpy).toHaveBeenCalledWith(
      "email-cron: contract is live but the announced dates say not-live - check economics.ts / NEXT_PUBLIC_SALE_* dates",
    )
  })

  it("skips silently when the dates and the contract agree not-live", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.stubEnv("NEXT_PUBLIC_SALE_OPENS", "2099-01-01T00:00:00Z")
    saleIsLive.mockResolvedValue(false)
    const res = await call("Bearer s3cret")
    expect(await res.json()).toEqual({ skipped: "not-live" })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it("skips when another run holds the lease", async () => {
    acquireCronLease.mockResolvedValue(false)
    const res = await call("Bearer s3cret")
    expect(await res.json()).toEqual({ skipped: "locked" })
    expect(readCommitments).not.toHaveBeenCalled()
  })

  it("first run records a baseline, sends nothing, and says so", async () => {
    readCommitments.mockResolvedValue({ clearingPriceUsd: 0.07 })
    dbSelect.mockResolvedValue([])
    const res = await call("Bearer s3cret")
    const body = await res.json()
    expect(body.decision).toBe("skip:first-run-baseline")
    expect(body.sent).toBe(false)
    expect(dbInsert).toHaveBeenCalled()
  })

  it("dry-runs a send decision without Mailchimp and WITHOUT advancing state", async () => {
    readCommitments.mockResolvedValue({ clearingPriceUsd: 0.09 })
    dbSelect.mockResolvedValue([{ id: 1, lastSentPriceUsd: 0.07, lastSentAt: new Date(0) }])
    const res = await call("Bearer s3cret")
    const body = await res.json()
    expect(body.decision).toBe("send")
    expect(body.dryRun).toBe(true)
    expect(body.sent).toBe(false)
    // A dry run nobody received must not start a cooldown for the real sends.
    expect(dbInsert).not.toHaveBeenCalled()
  })

  it("does not advance state when the cooldown defers a rise", async () => {
    readCommitments.mockResolvedValue({ clearingPriceUsd: 0.09 })
    dbSelect.mockResolvedValue([{ id: 1, lastSentPriceUsd: 0.07, lastSentAt: new Date() }])
    const res = await call("Bearer s3cret")
    const body = await res.json()
    expect(body.decision).toBe("skip:cooldown")
    expect(dbInsert).not.toHaveBeenCalled()
  })

  it("502s and does not advance state when the Mailchimp send fails, but still releases the lease", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubEnv("EMAIL_ALERTS_ENABLED", "1")
    readCommitments.mockResolvedValue({ clearingPriceUsd: 0.09 })
    dbSelect.mockResolvedValue([{ id: 1, lastSentPriceUsd: 0.07, lastSentAt: new Date(0) }])
    sendPriceCampaign.mockResolvedValue({ outcome: "error", step: "send", status: 500 })
    const res = await call("Bearer s3cret")
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.sent).toBe(false)
    expect(dbInsert).not.toHaveBeenCalled()
    expect(releaseCronLease).toHaveBeenCalledWith("email-cron")
    expect(errorSpy).toHaveBeenCalledWith("email-cron: mailchimp send -> HTTP 500")
  })
})
