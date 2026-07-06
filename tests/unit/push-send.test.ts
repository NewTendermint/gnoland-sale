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

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.useRealTimers()
  sendNotification.mockReset()
})

describe("sendOutbidNotifications failures", () => {
  it("prunes 404/410 without logging", async () => {
    const { sendOutbidNotifications } = await import("../../lib/push/send")
    sendNotification.mockRejectedValueOnce({ statusCode: 410 })
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await sendOutbidNotifications([target])
    expect(res.expiredEndpoints).toEqual([target.endpoint])
    expect(spy).not.toHaveBeenCalled()
  })

  it("logs other failures (status + host only) and does not prune", async () => {
    const { sendOutbidNotifications } = await import("../../lib/push/send")
    sendNotification.mockRejectedValueOnce({ statusCode: 403 })
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const res = await sendOutbidNotifications([target])
    expect(res.expiredEndpoints).toEqual([])
    expect(res.sent).toBe(0)
    expect(spy).toHaveBeenCalledWith("push-send: fcm.googleapis.com -> 403")
  })
})

describe("sendOutbidNotifications delivery options", () => {
  it("sends with urgency high, a 5s timeout, and TTL clamped to 6h when sale close is far away", async () => {
    vi.stubEnv("NEXT_PUBLIC_SALE_CLOSES", "2099-01-01T00:00:00Z")
    const { sendOutbidNotifications } = await import("../../lib/push/send")
    sendNotification.mockResolvedValueOnce(undefined)
    await sendOutbidNotifications([target])
    expect(sendNotification).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      TTL: 6 * 60 * 60,
      urgency: "high",
      timeout: 5000,
    })
  })

  it("shrinks TTL to the time remaining before sale close when under 6h away", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))
    vi.stubEnv("NEXT_PUBLIC_SALE_CLOSES", "2026-01-01T03:00:00Z")
    const { sendOutbidNotifications } = await import("../../lib/push/send")
    sendNotification.mockResolvedValueOnce(undefined)
    await sendOutbidNotifications([target])
    expect(sendNotification).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      TTL: 3 * 60 * 60,
      urgency: "high",
      timeout: 5000,
    })
  })

  it("floors TTL at 0 once the sale has already closed", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-02T00:00:00Z"))
    vi.stubEnv("NEXT_PUBLIC_SALE_CLOSES", "2026-01-01T00:00:00Z")
    const { sendOutbidNotifications } = await import("../../lib/push/send")
    sendNotification.mockResolvedValueOnce(undefined)
    await sendOutbidNotifications([target])
    expect(sendNotification).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      TTL: 0,
      urgency: "high",
      timeout: 5000,
    })
  })
})
