import { describe, expect, it } from "vitest"
import { classifyUserAgent } from "../../lib/security/user-agent"

const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
const FIREFOX_LINUX = "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0"
const EDGE_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

describe("classifyUserAgent", () => {
  it("buckets common browser/platform combinations coarsely", () => {
    expect(classifyUserAgent(CHROME_ANDROID)).toBe("chrome-mobile")
    expect(classifyUserAgent(CHROME_WIN)).toBe("chrome-desktop")
    expect(classifyUserAgent(SAFARI_IPHONE)).toBe("safari-mobile")
    expect(classifyUserAgent(FIREFOX_LINUX)).toBe("firefox-desktop")
  })

  it("detects Edge before Chrome (Edge UA also contains 'Chrome')", () => {
    expect(classifyUserAgent(EDGE_WIN)).toBe("edge-desktop")
  })

  it("classes bots", () => {
    expect(classifyUserAgent(GOOGLEBOT)).toBe("bot")
  })

  it("returns 'unknown' for null/empty input", () => {
    expect(classifyUserAgent(null)).toBe("unknown")
    expect(classifyUserAgent("")).toBe("unknown")
  })

  it("never returns a value containing version numbers or the raw UA", () => {
    const result = classifyUserAgent(CHROME_WIN)
    expect(result).not.toContain("120")
    expect(result.length).toBeLessThan(24)
  })
})
