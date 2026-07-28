import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

// Locale-aware navigation. Use these instead of next/link and next/navigation,
// so links, redirects and the language switch keep the active locale prefix.
const nav = createNavigation(routing)

export const { Link, usePathname } = nav

/**
 * Exported without a caller, so the next/navigation equivalents are never the
 * only ones in reach: those drop the locale prefix, and on Netlify a
 * next.config redirect runs after the middleware, with no later layer to fix it.
 *
 * @knipignore
 */
export const redirect = nav.redirect

/** @knipignore Same reason as `redirect`; also syncs the locale cookie. */
export const useRouter = nav.useRouter
