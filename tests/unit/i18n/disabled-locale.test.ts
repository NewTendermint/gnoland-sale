import { describe, expect, it } from "vitest"
import { ALL_LOCALES, DISABLED_LOCALES, LOCALES, disabledLocalePath } from "../../../i18n/locales"

/**
 * The middleware's only new runtime behavior: collapsing a disabled locale's URL onto the served
 * one. A pure string function, so it is unit-tested rather than checked by hand on a preview.
 *
 * The prefix-matching block is skipped when every catalog ships (nothing is disabled), so
 * re-enabling a locale never reddens CI - the "leaves served paths alone" block still runs.
 */
describe("disabledLocalePath", () => {
  it("declares every disabled locale as a known catalog that is not shipped", () => {
    for (const locale of DISABLED_LOCALES) {
      expect(ALL_LOCALES).toContain(locale)
      expect(LOCALES as readonly string[]).not.toContain(locale)
    }
  })

  describe.skipIf(DISABLED_LOCALES.length === 0)("on a disabled prefix", () => {
    const locale = DISABLED_LOCALES[0]

    it("collapses the bare prefix onto the site root", () => {
      expect(disabledLocalePath(`/${locale}`)).toBe("/")
      expect(disabledLocalePath(`/${locale}/`)).toBe("/")
    })

    it("keeps the rest of the path, and its casing", () => {
      expect(disabledLocalePath(`/${locale}/terms-of-service`)).toBe("/terms-of-service")
      expect(disabledLocalePath(`/${locale}/Some-Page`)).toBe("/Some-Page")
    })

    it("matches the prefix case-insensitively", () => {
      expect(disabledLocalePath(`/${locale.toUpperCase()}/privacy-policy`)).toBe("/privacy-policy")
    })

    it("matches a percent-encoded prefix, like next-intl's own decoded matching", () => {
      // "/%6Bo/..." decodes to "/ko/...". Without decoding here it would slip through and be
      // resolved by the layer below into a locale that no longer exists - a 404.
      const encoded = `/%${locale.charCodeAt(0).toString(16)}${locale.slice(1)}/privacy-policy`
      expect(disabledLocalePath(encoded)).toBe("/privacy-policy")
    })

    it("sanitizes separators that could collapse the redirect into another origin", () => {
      expect(disabledLocalePath(`/${locale}/\\evil.example`)).toBe("/%5Cevil.example")
      expect(disabledLocalePath(`/${locale}//evil.example`)).toBe("/evil.example")
      expect(disabledLocalePath(`/${locale}/\t/evil.example`)).toBe("/evil.example")
    })

    it("does not match a path that merely starts with the same letters", () => {
      expect(disabledLocalePath(`/${locale}mbucha`)).toBeNull()
      expect(disabledLocalePath(`/${locale}-page`)).toBeNull()
    })

    it("leaves a malformed URI to Next rather than redirecting it", () => {
      expect(disabledLocalePath("/%E0%A4%A")).toBeNull()
    })
  })

  it("leaves served paths alone", () => {
    expect(disabledLocalePath("/")).toBeNull()
    expect(disabledLocalePath("/privacy-policy")).toBeNull()
    for (const locale of LOCALES) {
      expect(disabledLocalePath(`/${locale}`)).toBeNull()
      expect(disabledLocalePath(`/${locale}/privacy-policy`)).toBeNull()
    }
  })
})
