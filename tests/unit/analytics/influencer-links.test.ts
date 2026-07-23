import { describe, expect, it } from "vitest"
import {
  INFLUENCER_CAMPAIGN,
  INFLUENCER_HANDLES,
  INFLUENCER_LOCALES,
  INFLUENCER_MEDIUM,
  type InfluencerHandle,
  influencerDestination,
  influencerRedirectFor,
  isInfluencerHandle,
} from "../../../lib/analytics/influencer-links"

// Route prefixes the app owns; a promoter handle colliding with one would either shadow a real
// route or never match. Mirrors the middleware's locale + reserved-path handling.
const RESERVED_SEGMENTS = ["api", "_next", "en", "ko", "dev"]

// Where a handle should land, per the `as-needed` locale prefixing (default "en" is unprefixed).
function expectedPath(handle: InfluencerHandle): string {
  const locale = INFLUENCER_LOCALES[handle]
  return locale === "en" ? "/" : `/${locale}`
}

function paramsOf(destination: string): URLSearchParams {
  return new URL(destination, "https://example.test").searchParams
}

describe("influencer vanity links", () => {
  it("maps each promoter path to a redirect, attributing utm_source to the handle", () => {
    for (const handle of INFLUENCER_HANDLES) {
      const destination = influencerRedirectFor(`/${handle}`)
      expect(destination).not.toBeNull()
      expect(paramsOf(destination as string).get("utm_source")).toBe(handle)
    }
  })

  it("tags every link with the shared cohort medium and campaign", () => {
    for (const handle of INFLUENCER_HANDLES) {
      const params = paramsOf(influencerDestination(handle))
      expect(params.get("utm_medium")).toBe(INFLUENCER_MEDIUM)
      expect(params.get("utm_campaign")).toBe(INFLUENCER_CAMPAIGN)
    }
  })

  it("lands each promoter on its pinned locale path", () => {
    for (const handle of INFLUENCER_HANDLES) {
      const pathname = new URL(influencerDestination(handle), "https://example.test").pathname
      expect(pathname).toBe(expectedPath(handle))
    }
  })

  it("routes the current cohort to the Korean site", () => {
    // Every promoter we have so far is Korean-audience; each must land on /ko, not the English root.
    for (const handle of INFLUENCER_HANDLES) {
      expect(INFLUENCER_LOCALES[handle]).toBe("ko")
      expect(influencerRedirectFor(`/${handle}`)).toMatch(/^\/ko\?/)
    }
  })

  it("ignores a leading/trailing slash on the matched path", () => {
    const handle = INFLUENCER_HANDLES[0]
    expect(influencerRedirectFor(`/${handle}`)).toBe(influencerDestination(handle))
    expect(influencerRedirectFor(`/${handle}/`)).toBe(influencerDestination(handle))
  })

  // Regression guard for the real bug: locale routing resolves `/<slug>` first on the host, so a
  // handle must be matched as a BARE segment. A locale-prefixed or nested path must NOT match,
  // otherwise the redirect and the locale layer fight over the same paths.
  it("does not match locale-prefixed, nested, or unknown paths", () => {
    const handle = INFLUENCER_HANDLES[0]
    expect(influencerRedirectFor("/")).toBeNull()
    expect(influencerRedirectFor(`/en/${handle}`)).toBeNull()
    expect(influencerRedirectFor(`/ko/${handle}`)).toBeNull()
    expect(influencerRedirectFor(`/${handle}/extra`)).toBeNull()
    expect(influencerRedirectFor("/not-a-promoter")).toBeNull()
    expect(influencerRedirectFor(`/${handle.toUpperCase()}`)).toBeNull() // case-sensitive
  })

  it("recognises exactly the known handles", () => {
    for (const handle of INFLUENCER_HANDLES) expect(isInfluencerHandle(handle)).toBe(true)
    expect(isInfluencerHandle("nope")).toBe(false)
  })

  it("uses handles that are unique, so no two promoters share attribution", () => {
    expect(new Set(INFLUENCER_HANDLES).size).toBe(INFLUENCER_HANDLES.length)
  })

  it("uses lowercase, URL-safe handles (encoding is a no-op)", () => {
    for (const handle of INFLUENCER_HANDLES) {
      expect(handle).toBe(handle.toLowerCase())
      expect(handle).toMatch(/^[a-z0-9_-]+$/)
      expect(encodeURIComponent(handle)).toBe(handle)
    }
  })

  it("never uses a handle that collides with an app route prefix", () => {
    for (const handle of INFLUENCER_HANDLES) {
      expect(RESERVED_SEGMENTS).not.toContain(handle)
    }
  })
})
