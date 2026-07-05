import { beforeEach, describe, expect, it, vi } from "vitest"

const readCommitments = vi.fn()
const dbSelect = vi.fn()
const dbInsert = vi.fn()
vi.mock("@/lib/sonar/commitments", () => ({
  readCommitments: (...a: unknown[]) => readCommitments(...a),
}))
vi.mock("@/lib/db/client", () => ({
  db: {
    select: () => ({ from: () => dbSelect() }),
    insert: () => ({
      values: (v: unknown) => ({ onConflictDoUpdate: (u: unknown) => dbInsert(v, u) }),
    }),
  },
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
})

describe("POST /api/email/cron", () => {
  it("401s without the bearer secret", async () => {
    const res = await call()
    expect(res.status).toBe(401)
  })

  it("skips outside the sale window", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_OPENS", "2099-01-01T00:00:00Z")
    const res = await call("Bearer s3cret")
    expect(await res.json()).toEqual({ skipped: "not-live" })
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
})
