import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the Mailchimp boundary so the route tests pin OUR behavior (validation,
// honeypot, rate limit, response uniformity), not the upstream.
vi.mock("@/lib/newsletter/mailchimp", () => ({
  subscribePending: vi.fn(async () => "ok"),
}))

import { subscribePending } from "@/lib/newsletter/mailchimp"
import { POST } from "../../../app/api/newsletter/route"

const subscribeMock = vi.mocked(subscribePending)

// Distinct IP per test: the route's rate limiter is module-level state.
let ipCounter = 0
function nextIp(): string {
  ipCounter += 1
  return `10.0.0.${ipCounter}`
}

function makeRequest(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/newsletter", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  subscribeMock.mockClear()
  subscribeMock.mockResolvedValue("ok")
})

describe("POST /api/newsletter", () => {
  it("accepts a valid email with the same 202 body every time (anti-enumeration)", async () => {
    const res = await POST(makeRequest({ email: "user@example.com" }, nextIp()))
    expect(res.status).toBe(202)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(subscribeMock).toHaveBeenCalledWith("user@example.com")
  })

  it("normalizes the email (trim + lowercase) before subscribing", async () => {
    const res = await POST(makeRequest({ email: "  User@EXAMPLE.com " }, nextIp()))
    expect(res.status).toBe(202)
    expect(subscribeMock).toHaveBeenCalledWith("user@example.com")
  })

  it("rejects an invalid email shape with 400", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }, nextIp()))
    expect(res.status).toBe(400)
    expect(subscribeMock).not.toHaveBeenCalled()
  })

  it("rejects a non-JSON body with 400", async () => {
    const res = await POST(
      new Request("http://localhost/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": nextIp() },
        body: "not json",
      }),
    )
    expect(res.status).toBe(400)
  })

  it("silently drops a tripped honeypot: success body, no upstream call", async () => {
    const res = await POST(makeRequest({ email: "bot@example.com", topic: "Bot Inc" }, nextIp()))
    expect(res.status).toBe(202)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(subscribeMock).not.toHaveBeenCalled()
  })

  it("maps an upstream failure to a generic 502", async () => {
    subscribeMock.mockResolvedValueOnce("upstream-error")
    const res = await POST(makeRequest({ email: "user@example.com" }, nextIp()))
    expect(res.status).toBe(502)
    await expect(res.json()).resolves.toEqual({ error: "subscribe_failed" })
  })

  it("rate limits the same IP after 5 requests in the window", async () => {
    const ip = nextIp()
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest({ email: `u${i}@example.com` }, ip))
      expect(res.status).toBe(202)
    }
    const res = await POST(makeRequest({ email: "u6@example.com" }, ip))
    expect(res.status).toBe(429)
    // A different IP is not affected by that window.
    const other = await POST(makeRequest({ email: "u7@example.com" }, nextIp()))
    expect(other.status).toBe(202)
  })
})
