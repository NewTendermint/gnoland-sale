import { afterEach, describe, expect, it, vi } from "vitest"
import handler from "../../../netlify/edge-functions/analytics-proxy"

const mockUpstream = (headers: Record<string, string>) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("payload", { status: 200, headers }))

describe("analytics proxy response hardening", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("sandboxes every response so a reflected HTML upstream can never run on our origin", async () => {
    mockUpstream({ "content-type": "text/html" })
    const res = await handler(new Request("https://sale.gno.land/sgl/simple.gif?x=1"))
    expect(res.headers.get("content-security-policy")).toBe("default-src 'none'; sandbox")
    expect(res.headers.get("x-content-type-options")).toBe("nosniff")
  })

  it("still strips upstream Set-Cookie", async () => {
    mockUpstream({ "content-type": "text/plain", "set-cookie": "sa=1" })
    const res = await handler(new Request("https://sale.gno.land/sgl/append"))
    expect(res.headers.get("set-cookie")).toBeNull()
  })
})
