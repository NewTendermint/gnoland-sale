import { languageAlternates } from "@/i18n/routing"
import type { MetadataRoute } from "next"

// One entry per public page, each carrying the hreflang alternates of the SHIPPED locales (see
// i18n/routing.ts). English lives at the unprefixed path; a disabled locale is absent here, so the
// sitemap never points a crawler at a URL we no longer serve.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sale.gno.land"
  const paths = ["", "/privacy-policy", "/terms-of-service", "/us-investor-disclaimer"] as const

  return paths.map((p) => {
    const isHome = p === ""
    const path = isHome ? "/" : p
    return {
      url: `${base}${path}`,
      changeFrequency: isHome ? "daily" : "monthly",
      priority: isHome ? 1 : 0.5,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(languageAlternates(path)).map(([lang, href]) => [lang, `${base}${href}`]),
        ),
      },
    }
  })
}
