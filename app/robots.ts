import { routing } from "@/i18n/routing"
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sale.gno.land"
  return {
    // Dev gallery is disallowed under every SHIPPED locale prefix (a disabled locale has no served
    // URL to disallow, and naming it here would leak it); /api is never indexable.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dev/", ...routing.locales.map((locale) => `/${locale}/dev/`), "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
