import { beforeEach, describe, expect, it, vi } from "vitest"

const getSession = vi.fn()
const readCommitments = vi.fn()
const dbInsertValues = vi.fn()
const dbOnConflictDoUpdate = vi.fn()

vi.mock("@/lib/security/session", () => ({
  getSession: (...a: unknown[]) => getSession(...a),
}))
vi.mock("@/lib/sonar/commitments", () => ({
  readCommitments: (...a: unknown[]) => readCommitments(...a),
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

beforeEach(() => {
  vi.resetModules()
  getSession.mockReset()
  readCommitments.mockReset()
  dbInsertValues.mockReset()
  dbOnConflictDoUpdate.mockReset()
  getSession.mockResolvedValue({ sessionId: "s1" })
})

describe("POST /api/push/subscribe lastStatus", () => {
  it("stores 'outbid' when the submitted bid is already below the clearing price", async () => {
    readCommitments.mockResolvedValue({ clearingPriceUsd: 0.09 })
    const res = await post(0.07)
    expect(res.status).toBe(200)
    expect(dbInsertValues).toHaveBeenCalledWith(expect.objectContaining({ lastStatus: "outbid" }))
    expect(dbOnConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ set: expect.objectContaining({ lastStatus: "outbid" }) }),
    )
  })

  it("stores 'winning' when the submitted bid is at or above the clearing price", async () => {
    readCommitments.mockResolvedValue({ clearingPriceUsd: 0.09 })
    const res = await post(0.09)
    expect(res.status).toBe(200)
    expect(dbInsertValues).toHaveBeenCalledWith(expect.objectContaining({ lastStatus: "winning" }))
    expect(dbOnConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ set: expect.objectContaining({ lastStatus: "winning" }) }),
    )
  })

  it("stores 'winning' when there is no clearing price yet", async () => {
    readCommitments.mockResolvedValue({ clearingPriceUsd: null })
    const res = await post(0.01)
    expect(res.status).toBe(200)
    expect(dbInsertValues).toHaveBeenCalledWith(expect.objectContaining({ lastStatus: "winning" }))
  })

  it("still inserts the subscription as 'winning' when readCommitments fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    readCommitments.mockRejectedValue(new Error("sonar down"))
    const res = await post(0.01)
    expect(res.status).toBe(200)
    expect(dbInsertValues).toHaveBeenCalledWith(expect.objectContaining({ lastStatus: "winning" }))
    expect(errorSpy).toHaveBeenCalledWith("push-subscribe: commitments read failed:", "sonar down")
    errorSpy.mockRestore()
  })
})
