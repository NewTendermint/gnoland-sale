import { beforeEach, describe, expect, it, vi } from "vitest"

const getSession = vi.fn()
const readCommitmentsCached = vi.fn()
const dbInsertValues = vi.fn()
const dbOnConflictDoUpdate = vi.fn()

vi.mock("@/lib/security/session", () => ({
  getSession: (...a: unknown[]) => getSession(...a),
}))
vi.mock("@/lib/sonar/commitments", () => ({
  readCommitmentsCached: (...a: unknown[]) => readCommitmentsCached(...a),
}))
vi.mock("@/lib/db/client", () => ({
  db: {
    insert: () => ({
      values: (row: unknown) => {
        dbInsertValues(row)
        return { onConflictDoUpdate: (opts: unknown) => dbOnConflictDoUpdate(opts) }
      },
    }),
  },
}))

const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "k", auth: "a" },
}

async function post(bidLimitUsd: number) {
  const { POST } = await import("../../../app/api/push/subscribe/route")
  return POST(
    new Request("http://x/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify({ subscription, bidLimitUsd }),
    }),
  )
}

function updateSet(): Record<string, unknown> {
  const opts = dbOnConflictDoUpdate.mock.calls[0]?.[0] as { set: Record<string, unknown> }
  return opts.set
}

beforeEach(() => {
  vi.resetModules()
  getSession.mockReset()
  readCommitmentsCached.mockReset()
  dbInsertValues.mockReset()
  dbOnConflictDoUpdate.mockReset()
  getSession.mockResolvedValue({ sessionId: "s1" })
})

describe("POST /api/push/subscribe lastStatus seeding", () => {
  it("seeds 'outbid' on INSERT when the submitted bid is already below the clearing price", async () => {
    readCommitmentsCached.mockResolvedValue({ clearingPriceUsd: 0.09 })
    const res = await post(0.07)
    expect(res.status).toBe(200)
    expect(dbInsertValues).toHaveBeenCalledWith(expect.objectContaining({ lastStatus: "outbid" }))
  })

  it("seeds 'winning' on INSERT when the submitted bid is at or above the clearing price", async () => {
    readCommitmentsCached.mockResolvedValue({ clearingPriceUsd: 0.09 })
    const res = await post(0.09)
    expect(res.status).toBe(200)
    expect(dbInsertValues).toHaveBeenCalledWith(expect.objectContaining({ lastStatus: "winning" }))
  })

  it("seeds 'winning' when there is no clearing price yet", async () => {
    readCommitmentsCached.mockResolvedValue({ clearingPriceUsd: null })
    const res = await post(0.01)
    expect(res.status).toBe(200)
    expect(dbInsertValues).toHaveBeenCalledWith(expect.objectContaining({ lastStatus: "winning" }))
  })

  it("still inserts the subscription as 'winning' when the metrics read fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    readCommitmentsCached.mockRejectedValue(new Error("sonar down"))
    const res = await post(0.01)
    expect(res.status).toBe(200)
    expect(dbInsertValues).toHaveBeenCalledWith(expect.objectContaining({ lastStatus: "winning" }))
    expect(errorSpy).toHaveBeenCalledWith("push-subscribe: commitments read failed:", "sonar down")
  })

  it("NEVER carries lastStatus into the conflict update - the cron is the sole writer after insert", async () => {
    readCommitmentsCached.mockResolvedValue({ clearingPriceUsd: 0.09 })
    await post(0.07)
    const set = updateSet()
    expect("lastStatus" in set).toBe(false)
    // The update path still refreshes the delivery keys and the limit.
    expect(set).toHaveProperty("p256dh")
    expect(set).toHaveProperty("auth")
    expect(set).toHaveProperty("bidLimitUsd")
  })
})
