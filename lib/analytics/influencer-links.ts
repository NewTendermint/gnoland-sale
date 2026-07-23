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
 * First-party attribution cookie. Set by the middleware on the `/<handle>` redirect (server-side, so
 * a script/ad blocker cannot suppress it), read server-side at the authenticated entity read to bind
 * the visitor's KYC entity to their promoter, and read client-side by track.ts to tag the Simple
 * Analytics bid funnel. Not HttpOnly - the value is a public promoter handle, no secret. Uses the
 * `__Host-` prefix in production (enforces Secure + path=/ + host-locked); dev is plain http, so it
 * drops the prefix and Secure, exactly like the session cookie.
 */
export const ATTRIBUTION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-gnot_attr" : "gnot_attr"

/** 30 days: long enough to bridge browse -> KYC -> bid across sessions, gone soon after the sale. */
export const ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

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
 * The promoter handle for a bare `/<handle>` path, or null. Single bare segment, case-sensitive,
 * leading/trailing slashes ignored; a locale-prefixed or nested path is intentionally not a match.
 */
export function influencerHandleFor(pathname: string): InfluencerHandle | null {
  const segment = pathname.replace(/^\/+/, "").replace(/\/+$/, "")
  return isInfluencerHandle(segment) ? segment : null
}

/**
 * Validate an attribution cookie value against the known-handle set. Returns the handle only if we
 * recognise it, so a tampered or stale cookie can never carry an arbitrary value into the store.
 */
export function resolveAttributionHandle(
  cookieValue: string | undefined | null,
): InfluencerHandle | null {
  return cookieValue != null && isInfluencerHandle(cookieValue) ? cookieValue : null
}
