import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sale.gno.land"
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dev/", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  }
}
