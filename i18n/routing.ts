import { defineRouting } from "next-intl/routing"
import { DEFAULT_LOCALE, LOCALES } from "./locales"

// The locale table itself lives in ./locales (no imports, so the edge middleware and client code
// can read it without pulling next-intl in). This module is the next-intl binding on top of it.
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  // 'as-needed' keeps the default locale at "/" (preserving existing SEO equity and shared links);
  // any further shipped locale is served under "/<locale>". With English alone, every page lives
  // unprefixed and next-intl stops emitting alternate-language Link headers on its own.
  localePrefix: "as-needed",
})

/** Nothing to switch between while a single locale ships, so the language switch renders nothing. */
export const LOCALE_SWITCH_ENABLED = routing.locales.length > 1

/**
 * hreflang alternates for a page path ("/" for the home page), derived from the SHIPPED locales:
 * the default locale at the unprefixed path, every other shipped locale under its prefix, plus
 * x-default on the default locale. A disabled locale drops out here automatically, so no hreflang
 * ever advertises a URL we do not serve.
 */
export function languageAlternates(path = "/"): Record<string, string> {
  const suffix = path === "/" ? "" : path
  const alternates: Record<string, string> = {}
  for (const locale of routing.locales) {
    alternates[locale] = locale === routing.defaultLocale ? path : `/${locale}${suffix}`
  }
  alternates["x-default"] = path
  return alternates
}
