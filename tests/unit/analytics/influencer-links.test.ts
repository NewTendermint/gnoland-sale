import { describe, expect, it } from "vitest"
import {
  ALL_LOCALES,
  DEFAULT_LOCALE,
  DISABLED_LOCALES,
  LOCALES,
  isShippedLocale,
} from "../../../i18n/locales"
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_COOKIE_MAX_AGE,
  INFLUENCER_CAMPAIGN,
  INFLUENCER_HANDLES,
  INFLUENCER_LOCALES,
  INFLUENCER_MEDIUM,
  influencerDestination,
  influencerHandleFor,
  isInfluencerHandle,
  resolveAttributionHandle,
} from "../../../lib/analytics/influencer-links"

// Route prefixes the app owns; a promoter handle colliding with one would either shadow a real
// route or never match. Mirrors the middleware's locale + reserved-path handling - every declared
// locale, shipped or not, since a disabled prefix is still redirected there.
const RESERVED_SEGMENTS = ["api", "_next", ...ALL_LOCALES, "dev"]

function paramsOf(destination: string): URLSearchParams {
  return new URL(destination, "https://example.test").searchParams
}

describe("influencer vanity links", () => {
  it("attributes utm_source to the handle on each promoter destination", () => {
    for (const handle of INFLUENCER_HANDLES) {
      expect(paramsOf(influencerDestination(handle)).get("utm_source")).toBe(handle)
    }
  })

  it("tags every link with the shared cohort medium and campaign", () => {
    for (const handle of INFLUENCER_HANDLES) {
      const params = paramsOf(influencerDestination(handle))
      expect(params.get("utm_medium")).toBe(INFLUENCER_MEDIUM)
      expect(params.get("utm_campaign")).toBe(INFLUENCER_CAMPAIGN)
    }
  })

  it("routes each promoter to its audience locale, falling back to the root when it is not shipped", () => {
    // Mixed cohort: a promoter whose audience locale ships under a prefix lands there; the default
    // locale AND any disabled locale (Korean today) land on the unprefixed root, tags intact.
    for (const handle of INFLUENCER_HANDLES) {
      const locale = INFLUENCER_LOCALES[handle]
      const prefixed = isShippedLocale(locale) && locale !== DEFAULT_LOCALE
      expect(influencerDestination(handle)).toMatch(
        prefixed ? new RegExp(`^/${locale}\\?`) : /^\/\?/,
      )
    }
  })

  it("lands every promoter on a root the app actually serves", () => {
    // Enumerated up front rather than derived from the destination, so the assertion runs (and can
    // fail) whatever the current locale mix is - including the single-locale one.
    const servedRoots = ["/", ...LOCALES.filter((l) => l !== DEFAULT_LOCALE).map((l) => `/${l}`)]
    for (const handle of INFLUENCER_HANDLES) {
      const { pathname } = new URL(influencerDestination(handle), "https://example.test")
      expect(servedRoots).toContain(pathname)
    }
  })

  it("never points a promoter link at a disabled locale prefix", () => {
    for (const handle of INFLUENCER_HANDLES) {
      const destination = influencerDestination(handle)
      const hitsDisabledLocale = DISABLED_LOCALES.some((locale) =>
        new RegExp(`^/${locale}([/?]|$)`).test(destination),
      )
      expect(hitsDisabledLocale).toBe(false)
    }
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

describe("attribution capture helpers", () => {
  it("influencerHandleFor returns the handle for a bare promoter path (slashes ignored)", () => {
    for (const handle of INFLUENCER_HANDLES) {
      expect(influencerHandleFor(`/${handle}`)).toBe(handle)
      expect(influencerHandleFor(`/${handle}/`)).toBe(handle)
    }
  })

  it("influencerHandleFor rejects locale-prefixed, nested, or unknown paths", () => {
    const handle = INFLUENCER_HANDLES[0]
    expect(influencerHandleFor("/")).toBeNull()
    expect(influencerHandleFor(`/en/${handle}`)).toBeNull()
    expect(influencerHandleFor(`/${handle}/extra`)).toBeNull()
    expect(influencerHandleFor("/not-a-promoter")).toBeNull()
  })

  it("influencerHandleFor matches case-insensitively, returning the canonical lowercase handle", () => {
    // Promoters share their brand casing (e.g. /CryptoDiffer, /PENGUIN); any casing must resolve to
    // the single canonical lowercase handle so utm_source / cookie / SA goal filter stay consistent.
    for (const handle of INFLUENCER_HANDLES) {
      const mixed = handle.charAt(0).toUpperCase() + handle.slice(1)
      expect(influencerHandleFor(`/${handle.toUpperCase()}`)).toBe(handle)
      expect(influencerHandleFor(`/${mixed}`)).toBe(handle)
      expect(influencerHandleFor(`/${mixed}/`)).toBe(handle)
    }
  })

  // The cookie is attacker-controllable (client-side), so the store must trust only known handles.
  it("resolveAttributionHandle accepts only a known handle, rejecting tampered/absent values", () => {
    for (const handle of INFLUENCER_HANDLES) {
      expect(resolveAttributionHandle(handle)).toBe(handle)
    }
    expect(resolveAttributionHandle(undefined)).toBeNull()
    expect(resolveAttributionHandle(null)).toBeNull()
    expect(resolveAttributionHandle("")).toBeNull()
    expect(resolveAttributionHandle("not-a-promoter")).toBeNull()
    expect(resolveAttributionHandle("__proto__")).toBeNull() // no prototype-key leak
  })

  it("uses a host-locked cookie name and a 30-day window", () => {
    expect(ATTRIBUTION_COOKIE).toMatch(/gnot_attr$/)
    expect(ATTRIBUTION_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 30)
  })
})
