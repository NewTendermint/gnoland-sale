import type { MetadataRoute } from "next"

// Single-page site: allow everything except the dev harness and API surface.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sale.gno.land"
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dev/", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  }
}
