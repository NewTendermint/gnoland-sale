import { describe, expect, it } from "vitest"
import {
  INFLUENCER_CAMPAIGN,
  INFLUENCER_HANDLES,
  INFLUENCER_MEDIUM,
  influencerRedirects,
} from "../../../lib/analytics/influencer-links"

// Route prefixes the app owns; a promoter handle colliding with one would either shadow a real
// route or never match. Mirrors the middleware's locale + reserved-path handling.
const RESERVED_SEGMENTS = ["api", "_next", "en", "ko", "dev"]

describe("influencer vanity links", () => {
  const redirects = influencerRedirects()

  it("emits exactly one redirect per promoter", () => {
    expect(redirects).toHaveLength(INFLUENCER_HANDLES.length)
  })

  it("attributes each promoter individually: utm_source equals the handle", () => {
    for (const rule of redirects) {
      const handle = rule.source.slice(1) // drop leading "/"
      const params = new URL(rule.destination, "https://example.test").searchParams
      expect(params.get("utm_source")).toBe(handle)
      expect(INFLUENCER_HANDLES).toContain(handle)
    }
  })

  it("tags every link with the shared cohort medium and campaign", () => {
    for (const rule of redirects) {
      const params = new URL(rule.destination, "https://example.test").searchParams
      expect(params.get("utm_medium")).toBe(INFLUENCER_MEDIUM)
      expect(params.get("utm_campaign")).toBe(INFLUENCER_CAMPAIGN)
    }
  })

  it("redirects each handle to the site root", () => {
    for (const rule of redirects) {
      expect(new URL(rule.destination, "https://example.test").pathname).toBe("/")
    }
  })

  it("keeps redirects temporary so a handle can be reassigned (browser-uncached)", () => {
    for (const rule of redirects) {
      expect(rule.permanent).toBe(false)
    }
  })

  it("uses handles that are unique, so no two promoters share a source or attribution", () => {
    const sources = redirects.map((r) => r.source)
    expect(new Set(sources).size).toBe(sources.length)
    expect(new Set(INFLUENCER_HANDLES).size).toBe(INFLUENCER_HANDLES.length)
  })

  it("uses lowercase, URL-safe handles (path matching is case-sensitive)", () => {
    for (const handle of INFLUENCER_HANDLES) {
      expect(handle).toBe(handle.toLowerCase())
      expect(handle).toMatch(/^[a-z0-9_-]+$/)
      // encoding must be a no-op, otherwise the source path and the utm_source value diverge.
      expect(encodeURIComponent(handle)).toBe(handle)
    }
  })

  it("never uses a handle that collides with an app route prefix", () => {
    for (const handle of INFLUENCER_HANDLES) {
      expect(RESERVED_SEGMENTS).not.toContain(handle)
    }
  })
})
