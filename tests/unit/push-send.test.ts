import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const sendNotification = vi.fn()
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: (...a: unknown[]) => sendNotification(...a),
  },
  setVapidDetails: vi.fn(),
  sendNotification: (...a: unknown[]) => sendNotification(...a),
}))
vi.mock("@/lib/env", () => ({
  env: { VAPID_PUBLIC_KEY: "pub", VAPID_PRIVATE_KEY: "priv", VAPID_SUBJECT: undefined },
}))

const target = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: "k", auth: "a" }
// Any positive TTL: the failure tests exercise error handling, not the TTL value.
const ANY_TTL_S = 60

beforeEach(() => {
  vi.resetModules()
  sendNotification.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("sendOutbidNotifications failures", () => {
  it("prunes 404/410 without logging", async () => {
    const { sendOutbidNotifications } = await import("../../lib/push/send")
    sendNotification.mockRejectedValueOnce({ statusCode: 410 })
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await sendOutbidNotifications([target], ANY_TTL_S)
    expect(res.expiredEndpoints).toEqual([target.endpoint])
    expect(spy).not.toHaveBeenCalled()
  })

  it("logs other failures (status + host only) and does not prune", async () => {
    const { sendOutbidNotifications } = await import("../../lib/push/send")
    sendNotification.mockRejectedValueOnce({ statusCode: 403 })
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await sendOutbidNotifications([target], ANY_TTL_S)
    expect(res.expiredEndpoints).toEqual([])
    expect(res.sent).toBe(0)
    expect(spy).toHaveBeenCalledWith("push-send: fcm.googleapis.com -> 403")
  })
})

describe("sendOutbidNotifications delivery options", () => {
  it("passes the caller's TTL through with urgency high and the socket timeout", async () => {
    const CALLER_TTL_S = 1234
    const { SEND_SOCKET_TIMEOUT_MS, sendOutbidNotifications } = await import("../../lib/push/send")
    sendNotification.mockResolvedValueOnce(undefined)
    await sendOutbidNotifications([target], CALLER_TTL_S)
    expect(sendNotification).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      TTL: CALLER_TTL_S,
      urgency: "high",
      timeout: SEND_SOCKET_TIMEOUT_MS,
    })
  })
})
