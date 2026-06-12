import type { MetadataRoute } from "next"

// One canonical URL: the landing is a single page.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sale.gno.land"
  return [{ url: base, changeFrequency: "daily", priority: 1 }]
}
