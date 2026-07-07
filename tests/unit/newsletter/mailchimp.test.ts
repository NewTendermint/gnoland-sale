import { createHash } from "node:crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { subscribePending } from "../../../lib/newsletter/mailchimp"

// The module reads process.env directly so each case shapes its own environment.
afterEach(() => {
  vi.unstubAllEnvs()
})

function withCreds() {
  vi.stubEnv("MAILCHIMP_API_KEY", "0123456789abcdef0123456789abcdef-us21")
  vi.stubEnv("MAILCHIMP_AUDIENCE_ID", "aud123")
}

describe("subscribePending - mock gate", () => {
  it("a missing API key without the explicit flag fails closed, without calling fetch", async () => {
    vi.stubEnv("MAILCHIMP_MOCK", "")
    const fetchSpy = vi.fn()
    await expect(subscribePending("user@example.com", fetchSpy)).resolves.toBe("upstream-error")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("MAILCHIMP_MOCK=1 mocks ok in dev/test when no API key is configured", async () => {
    vi.stubEnv("MAILCHIMP_MOCK", "1")
    const fetchSpy = vi.fn()
    await expect(subscribePending("user@example.com", fetchSpy)).resolves.toBe("ok")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("MAILCHIMP_MOCK=1 forces the mock even with credentials", async () => {
    withCreds()
    vi.stubEnv("MAILCHIMP_MOCK", "1")
    const fetchSpy = vi.fn()
    await expect(subscribePending("user@example.com", fetchSpy)).resolves.toBe("ok")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("production never mocks: missing credentials fail closed as upstream-error", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const fetchSpy = vi.fn()
    await expect(subscribePending("user@example.com", fetchSpy)).resolves.toBe("upstream-error")
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe("subscribePending - upstream call", () => {
  it("PUTs the upsert to the key's datacenter with Basic auth and a pending status", async () => {
    withCreds()
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }))
    await expect(subscribePending("User@Example.com".toLowerCase(), fetchSpy)).resolves.toBe("ok")

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    const md5 = createHash("md5").update("user@example.com").digest("hex")
    expect(url).toBe(`https://us21.api.mailchimp.com/3.0/lists/aud123/members/${md5}`)
    expect(init.method).toBe("PUT")
    const headers = init.headers as Record<string, string>
    expect(headers.authorization).toBe(
      `Basic ${Buffer.from("anystring:0123456789abcdef0123456789abcdef-us21").toString("base64")}`,
    )
    // status_if_new only: an existing member's status is never touched.
    expect(JSON.parse(init.body as string)).toEqual({
      email_address: "user@example.com",
      status_if_new: "pending",
    })
  })

  it("maps a non-2xx upstream response to upstream-error", async () => {
    withCreds()
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 500 }))
    await expect(subscribePending("user@example.com", fetchSpy)).resolves.toBe("upstream-error")
  })

  it("maps a thrown fetch (network/timeout) to upstream-error", async () => {
    withCreds()
    const fetchSpy = vi.fn(async () => {
      throw new Error("network down")
    })
    await expect(subscribePending("user@example.com", fetchSpy)).resolves.toBe("upstream-error")
  })

  it("a malformed API key (no datacenter suffix) fails closed without calling fetch", async () => {
    vi.stubEnv("MAILCHIMP_API_KEY", "keywithoutdc")
    vi.stubEnv("MAILCHIMP_AUDIENCE_ID", "aud123")
    const fetchSpy = vi.fn()
    await expect(subscribePending("user@example.com", fetchSpy)).resolves.toBe("upstream-error")
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
