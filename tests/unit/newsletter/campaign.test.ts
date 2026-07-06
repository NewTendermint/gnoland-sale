import { afterEach, describe, expect, it, vi } from "vitest"
import { sendPriceCampaign } from "../../../lib/newsletter/campaign"

afterEach(() => vi.unstubAllEnvs())

function withCreds() {
  vi.stubEnv("MAILCHIMP_API_KEY", "0123456789abcdef0123456789abcdef-us21")
  vi.stubEnv("MAILCHIMP_AUDIENCE_ID", "aud123")
}

function okJson(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 })
}

describe("sendPriceCampaign", () => {
  it("creates, sets content, then sends, and reports the campaign id", async () => {
    withCreds()
    const calls: { url: string; method: string; body: string | undefined }[] = []
    const fetchSpy = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      calls.push({
        url: String(url),
        method: init?.method ?? "GET",
        body: init?.body as string | undefined,
      })
      if (calls.length === 1) return okJson({ id: "camp1" })
      return okJson({})
    })
    const res = await sendPriceCampaign(0.0812, fetchSpy as unknown as typeof fetch)
    expect(res).toEqual({ outcome: "ok", campaignId: "camp1" })
    expect(calls[0]).toMatchObject({ method: "POST" })
    expect(calls[0].url).toContain("us21.api.mailchimp.com/3.0/campaigns")
    expect(JSON.parse(calls[0].body ?? "{}").recipients.list_id).toBe("aud123")
    expect(JSON.parse(calls[0].body ?? "{}").settings.subject_line).toContain("$0.0812")
    expect(calls[1]).toMatchObject({ method: "PUT" })
    expect(calls[1].url).toContain("/campaigns/camp1/content")
    expect(calls[2]).toMatchObject({ method: "POST" })
    expect(calls[2].url).toContain("/campaigns/camp1/actions/send")
  })

  it.each([
    [1, "create"],
    [2, "content"],
    [3, "send"],
  ])("reports the failing step with its HTTP status (call %i -> %s)", async (failAt, step) => {
    withCreds()
    let n = 0
    const fetchSpy = vi.fn(async () => {
      n++
      if (n === failAt) return new Response("{}", { status: 400 })
      return okJson({ id: "camp1" })
    })
    const res = await sendPriceCampaign(0.08, fetchSpy as unknown as typeof fetch)
    expect(res).toEqual({ outcome: "error", step, status: 400 })
  })

  it("dev/test without credentials fails closed unless MAILCHIMP_MOCK=1 (same gate as subscribe)", async () => {
    const fetchSpy = vi.fn()
    vi.stubEnv("MAILCHIMP_MOCK", "")
    await expect(sendPriceCampaign(0.08, fetchSpy as unknown as typeof fetch)).resolves.toEqual({
      outcome: "error",
      step: "create",
      status: 0,
    })
    vi.stubEnv("MAILCHIMP_MOCK", "1")
    await expect(sendPriceCampaign(0.08, fetchSpy as unknown as typeof fetch)).resolves.toEqual({
      outcome: "ok",
      campaignId: "mock",
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("production without credentials fails closed without calling fetch", async () => {
    vi.stubEnv("NODE_ENV", "production")
    const fetchSpy = vi.fn()
    const res = await sendPriceCampaign(0.08, fetchSpy as unknown as typeof fetch)
    expect(res).toEqual({ outcome: "error", step: "create", status: 0 })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
