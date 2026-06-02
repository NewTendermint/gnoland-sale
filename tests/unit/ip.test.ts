import { describe, expect, it } from "vitest"
import { ipHmac, parseForwardedFor } from "../../lib/security/ip"

describe("ipHmac", () => {
  it("produces a 64-char hex digest (HMAC-SHA256)", () => {
    expect(ipHmac("203.0.113.7")).toMatch(/^[0-9a-f]{64}$/)
  })

  it("is deterministic for the same IP", () => {
    expect(ipHmac("203.0.113.7")).toBe(ipHmac("203.0.113.7"))
  })

  it("differs for different IPs", () => {
    expect(ipHmac("203.0.113.7")).not.toBe(ipHmac("203.0.113.8"))
  })

  it("never embeds the raw IP in the output", () => {
    const ip = "203.0.113.7"
    expect(ipHmac(ip)).not.toContain(ip)
  })
})

describe("parseForwardedFor", () => {
  it("takes the first hop from a comma list", () => {
    expect(parseForwardedFor("203.0.113.7, 70.41.3.18, 150.172.238.178")).toBe("203.0.113.7")
  })

  it("trims surrounding whitespace", () => {
    expect(parseForwardedFor("  203.0.113.7  ")).toBe("203.0.113.7")
  })

  it("returns null for a missing or empty header", () => {
    expect(parseForwardedFor(null)).toBeNull()
    expect(parseForwardedFor("")).toBeNull()
    expect(parseForwardedFor("   ")).toBeNull()
  })
})
