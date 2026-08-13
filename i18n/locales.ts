/**
 * The locale table, and it alone. Zero imports on purpose: this module is read by the edge
 * middleware, by client components (through lib/analytics/track.ts), and by the unit test runner,
 * so it must never drag next-intl - or anything else - along with it. The next-intl routing object
 * built on top of it lives in ./routing.
 */

// Every locale that HAS a catalog under messages/. English is the default and the legally-
// authoritative language (Terms of Service section 18.14); Korean is a complete translation kept
// in the repo (messages/ko.json + lib/i18n/glossary.ts).
export const ALL_LOCALES = ["en", "ko"] as const
export type Locale = (typeof ALL_LOCALES)[number]

// `satisfies` rather than a `Locale` annotation: the literal type must survive, or next-intl
// cannot check the default against the served tuple.
export const DEFAULT_LOCALE = "en" satisfies Locale

// The locales actually SERVED. Korean is disabled (2026-08-13): its catalog and glossary stay in
// the repo untouched, but nothing on the front references it - no /ko route, no hreflang alternate,
// no language switch, no sitemap entry, no promoter link pointing at it. Re-enabling is one edit:
// put "ko" back in this tuple. Everything else (routing, hreflang, the switch flag, the promoter
// destinations, the middleware redirect) derives from it.
export const LOCALES = ["en"] as const satisfies readonly Locale[]

/**
 * Locales present in the repo but not served. Their URL prefix is redirected to the served
 * equivalent by the middleware, so previously shared /ko links never land on a 404.
 */
export const DISABLED_LOCALES: readonly Locale[] = ALL_LOCALES.filter(
  (locale) => !(LOCALES as readonly string[]).includes(locale),
)

/** Is this locale served right now? False for a catalog kept in the repo but disabled. */
export function isShippedLocale(locale: Locale): boolean {
  return (LOCALES as readonly string[]).includes(locale)
}

/**
 * The path a disabled locale's URL collapses onto, or null when the path carries no disabled
 * prefix. `/ko` -> `/`, `/ko/terms-of-service` -> `/terms-of-service`, `/kombucha` -> null.
 *
 * Decoded and sanitized exactly like next-intl does before ITS prefix matching
 * (node_modules/next-intl/dist/esm/development/middleware/utils.js, sanitizePathname), for two
 * reasons: a percent-encoded prefix (`/%6Bo/...`) must not slip past us and then be decoded into a
 * dead locale by the layer below, and the result is fed to a redirect - decodeURI leaves encoded
 * backslashes and WHATWG-stripped control characters behind, both of which can collapse a path
 * into an open redirect. A malformed URI is left to Next (which answers 400), never redirected.
 */
export function disabledLocalePath(pathname: string): string | null {
  let decoded: string
  try {
    decoded = decodeURI(pathname)
  } catch {
    return null
  }
  const safe = decoded
    .replace(/\\/g, "%5C")
    .replace(/[\t\n\r]/g, "")
    .replace(/\/+/g, "/")
  const lower = safe.toLowerCase()

  for (const locale of DISABLED_LOCALES) {
    if (lower === `/${locale}` || lower.startsWith(`/${locale}/`)) {
      // Slice the sanitized path, not the raw one: the rest of the URL keeps its own casing.
      return safe.slice(locale.length + 1) || "/"
    }
  }
  return null
}
