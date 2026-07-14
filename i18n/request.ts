import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"

// Resolves the active locale per request and loads its message catalog. Called by next-intl
// on the server (via the plugin wired in next.config.ts). Invalid/absent locales fall back to
// the default so a malformed URL never throws.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
