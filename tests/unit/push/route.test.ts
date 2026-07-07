import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the I/O seams so the route test pins ONLY the orchestration that issue #47 is about:
// the lease guard and the persist-BEFORE-send ordering (send-first + crash = outbid spam loop).
const readCommitments = vi.fn()
const dbSelect = vi.fn()
const acquireCronLease = vi.fn()
const releaseCronLease = vi.fn()
const sendOutbidNotifications = vi.fn()
const saleIsLive = vi.fn()
// One shared call journal: the ORDER of persist vs send is the contract under test.
const calls: string[] = []

vi.mock("@/lib/sonar/commitments", () => ({
  readCommitments: (...a: unknown[]) => readCommitments(...a),
}))
vi.mock("@/lib/db/lease", () => ({
  CRON_LEASE_TTL_S: 240,
  acquireCronLease: (...a: unknown[]) => acquireCronLease(...a),
  releaseCronLease: (...a: unknown[]) => releaseCronLease(...a),
}))
// Named via vi.hoisted: vi.mock factories are hoisted above module-scope consts.
const { MOCK_TTL_CAP_S } = vi.hoisted(() => ({ MOCK_TTL_CAP_S: 6 * 60 * 60 }))
vi.mock("@/lib/push/send", () => ({
  OUTBID_TTL_CAP_S: MOCK_TTL_CAP_S,
  sendOutbidNotifications: (...a: unknown[]) => {
    calls.push("send")
    return sendOutbidNotifications(...a)
  },
}))
vi.mock("@/lib/sale/live-window", () => ({
  saleIsLive: (...a: unknown[]) => saleIsLive(...a),
  pushTtlSeconds: () => MOCK_TTL_CAP_S,
}))
vi.mock("@/lib/db/client", () => ({
  db: {
    select: () => ({ from: () => dbSelect() }),
    update: () => ({
      set: () => ({
        where: async () => {
          calls.push("persist")
        },
      }),
    }),
    delete: () => ({
      where: async () => {
        calls.push("prune")
      },
    }),
  },
}))

async function call(auth?: string) {
  const { POST } = await import("../../../app/api/push/cron/route")
  return POST(
    new Request("http://x/api/push/cron", {
      method: "POST",
      headers: auth ? { authorization: auth } : {},
    }),
  )
}

beforeEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.stubEnv("CRON_SECRET", "s3cret")
  calls.length = 0
  readCommitments.mockReset()
  dbSelect.mockReset()
  acquireCronLease.mockReset()
  releaseCronLease.mockReset()
  sendOutbidNotifications.mockReset()
  saleIsLive.mockReset()
  saleIsLive.mockResolvedValue(true)
  acquireCronLease.mockResolvedValue(true)
  sendOutbidNotifications.mockResolvedValue({ sent: 1, expiredEndpoints: [] })
})

describe("POST /api/push/cron", () => {
  it("401s without the bearer secret", async () => {
    const res = await call()
    expect(res.status).toBe(401)
  })

  it("skips when another run holds the lease (no reads, no sends)", async () => {
    acquireCronLease.mockResolvedValue(false)
    const res = await call("Bearer s3cret")
    expect(await res.json()).toEqual({ skipped: "locked" })
    expect(readCommitments).not.toHaveBeenCalled()
    expect(sendOutbidNotifications).not.toHaveBeenCalled()
  })

  it("persists the status transitions BEFORE sending (a crash after send cannot spam)", async () => {
    readCommitments.mockResolvedValue({ clearingPriceUsd: 0.09 })
    dbSelect.mockResolvedValue([
      { endpoint: "https://fcm.googleapis.com/a", bidLimitUsd: 0.07, lastStatus: "winning" },
    ])
    const res = await call("Bearer s3cret")
    expect(await res.json()).toEqual({ notified: 1, expired: 0 })
    // The whole point of issue #47: if this order flips back, a crash between the two re-detects
    // the same transition every 5 min and spams "You've been outbid".
    expect(calls.indexOf("persist")).toBeGreaterThanOrEqual(0)
    expect(calls.indexOf("persist")).toBeLessThan(calls.indexOf("send"))
    // The cron owns the TTL policy (chain-first close-date handling); the transport just carries it.
    expect(sendOutbidNotifications).toHaveBeenCalledWith(expect.anything(), MOCK_TTL_CAP_S)
    expect(releaseCronLease).toHaveBeenCalledWith("push-cron")
  })

  it("sends nothing when no status changed, and still completes cleanly", async () => {
    readCommitments.mockResolvedValue({ clearingPriceUsd: 0.05 })
    dbSelect.mockResolvedValue([
      { endpoint: "https://fcm.googleapis.com/a", bidLimitUsd: 0.07, lastStatus: "winning" },
    ])
    sendOutbidNotifications.mockResolvedValue({ sent: 0, expiredEndpoints: [] })
    const res = await call("Bearer s3cret")
    expect(await res.json()).toEqual({ notified: 0, expired: 0 })
    expect(calls).not.toContain("persist")
  })
})
