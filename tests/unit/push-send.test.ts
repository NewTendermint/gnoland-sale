import { afterEach, describe, expect, it, vi } from "vitest"

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

import { sendOutbidNotifications } from "../../lib/push/send"

afterEach(() => {
  vi.restoreAllMocks()
  sendNotification.mockReset()
})

const target = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: "k", auth: "a" }

describe("sendOutbidNotifications failures", () => {
  it("prunes 404/410 without logging", async () => {
    sendNotification.mockRejectedValueOnce({ statusCode: 410 })
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await sendOutbidNotifications([target])
    expect(res.expiredEndpoints).toEqual([target.endpoint])
    expect(spy).not.toHaveBeenCalled()
  })

  it("logs other failures (status + host only) and does not prune", async () => {
    sendNotification.mockRejectedValueOnce({ statusCode: 403 })
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await sendOutbidNotifications([target])
    expect(res.expiredEndpoints).toEqual([])
    expect(res.sent).toBe(0)
    expect(spy).toHaveBeenCalledWith("push-send: fcm.googleapis.com -> 403")
  })
})
