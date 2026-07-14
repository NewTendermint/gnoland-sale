import { defineRouting } from "next-intl/routing"

// The two shipped locales. English is the default and the legally-authoritative language
// (Terms of Service section 18.14). Korean is the added locale for Korean-speaking visitors.
export const LOCALES = ["en", "ko"] as const
export type Locale = (typeof LOCALES)[number]

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "en",
  // 'as-needed' keeps English at "/" (preserving existing SEO equity and shared links) and
  // serves Korean under "/ko". A Korean-preferring browser hitting "/" is redirected to "/ko"
  // by the middleware (cookie -> Accept-Language best-fit -> defaultLocale). Everyone else stays on "/".
  localePrefix: "as-needed",
})
