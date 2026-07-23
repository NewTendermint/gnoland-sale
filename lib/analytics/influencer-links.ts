import type { Locale } from "../../i18n/routing"

/**
 * Vanity redirect links handed to individual promoters.
 *
 * Each promoter gets a dedicated short path (`/<handle>`) that redirects to a locale-pinned site
 * root tagged with campaign query parameters. The analytics pipeline records the landed pageview
 * with those tags, so a visit is attributed to the individual promoter through `utm_source`, while
 * `utm_medium` groups the whole cohort under one filter and `utm_campaign` scopes the initiative.
 *
 * The redirect is resolved server-side (in the edge middleware, before locale routing) so the
 * tags survive the hop regardless of the visitor's environment (client scripting disabled,
 * blockers, etc.). It is done in the middleware rather than the build-time redirect table because
 * the locale-routing layer runs first on the hosting platform and would otherwise swallow
 * `/<handle>` as an unknown localized route (a not-found) before a build-time redirect can fire.
 *
 * Aside from the erased-at-build `Locale` type, this module is free of runtime and environment-only
 * imports: it is read both by the edge middleware and by the unit test runner.
 */

/** Shared across every promoter link: one filter for the whole cohort, one campaign umbrella. */
export const INFLUENCER_MEDIUM = "influencer"
export const INFLUENCER_CAMPAIGN = "gnot-ico"

/**
 * Single source of truth: one entry per promoter mapping the handle to the locale its audience
 * should land on. The handle is BOTH the public path segment and the `utm_source` value (individual
 * attribution). The locale is pinned explicitly rather than left to the visitor's browser language.
 * Add a promoter by adding a line; the value is type-checked against the shipped locales, so an
 * English-audience promoter is just `"en"`. Handles must be lowercase, URL-safe, and not collide
 * with a real route (path matching is case-sensitive).
 *
 * `as const` fixes the keys as a literal union (drives InfluencerHandle); the widened public view
 * below re-types the values to Locale so the default-locale branch in influencerDestination stays
 * live even while every current promoter shares one locale.
 */
const HANDLE_LOCALE_MAP = {
  airdropcosm: "ko",
  enjoymyhobby: "ko",
  airdr0p_lab: "ko",
  lnsanecoin: "ko",
} as const satisfies Record<string, Locale>

export type InfluencerHandle = keyof typeof HANDLE_LOCALE_MAP

export const INFLUENCER_HANDLES = Object.keys(HANDLE_LOCALE_MAP) as InfluencerHandle[]

export const INFLUENCER_LOCALES: Record<InfluencerHandle, Locale> = HANDLE_LOCALE_MAP

/** Type guard: is this bare path segment a known promoter handle? */
export function isInfluencerHandle(segment: string): segment is InfluencerHandle {
  return Object.hasOwn(INFLUENCER_LOCALES, segment)
}

/** The locale-pinned, tagged destination for a promoter handle (query values are URL-encoded). */
export function influencerDestination(handle: InfluencerHandle): string {
  const locale = INFLUENCER_LOCALES[handle]
  // `as-needed` prefixing (see i18n/routing.ts): the default locale "en" is served at the
  // unprefixed root, every other locale under `/<locale>`.
  const path = locale === "en" ? "/" : `/${locale}`
  return `${path}?utm_source=${encodeURIComponent(handle)}&utm_medium=${INFLUENCER_MEDIUM}&utm_campaign=${INFLUENCER_CAMPAIGN}`
}

/**
 * Maps a request pathname to its promoter redirect destination, or null when the path is not a
 * promoter link. Matches a single bare segment `/<handle>` (case-sensitive, leading/trailing
 * slashes ignored); a locale-prefixed or nested path is intentionally not a match.
 */
export function influencerRedirectFor(pathname: string): string | null {
  const segment = pathname.replace(/^\/+/, "").replace(/\/+$/, "")
  return isInfluencerHandle(segment) ? influencerDestination(segment) : null
}
