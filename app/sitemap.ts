import type { MetadataRoute } from "next"

// One entry per public page, each carrying its en/ko hreflang alternates so search engines index
// both locales and serve the right one. English lives at the unprefixed path, Korean under /ko.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sale.gno.land"
  const paths = ["", "/privacy-policy", "/terms-of-service", "/us-investor-disclaimer"] as const

  return paths.map((p) => {
    const isHome = p === ""
    return {
      url: `${base}${isHome ? "/" : p}`,
      changeFrequency: isHome ? "daily" : "monthly",
      priority: isHome ? 1 : 0.5,
      alternates: {
        languages: {
          en: `${base}${isHome ? "/" : p}`,
          ko: `${base}/ko${p}`,
        },
      },
    }
  })
}
