import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sale.gno.land"
  return {
    // Dev gallery is disallowed under every locale prefix; /api is never indexable.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dev/", "/en/dev/", "/ko/dev/", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
