/**
 * Vanity redirect links handed to individual promoters.
 *
 * Each promoter gets a dedicated short path (`/<handle>`) that redirects to the site root tagged
 * with campaign query parameters. The analytics pipeline records the landed pageview with those
 * tags, so a visit is attributed to the individual promoter through `utm_source`, while
 * `utm_medium` groups the whole cohort under one filter and `utm_campaign` scopes the initiative.
 *
 * The redirect is resolved server-side before any client script runs, so the tags survive the
 * hop regardless of the visitor's environment (client scripting disabled, blockers, etc.).
 *
 * This module is intentionally free of runtime and environment-only imports: it is read both by
 * the build configuration (Node, before the app bundle exists) and by the unit test runner.
 */

/** Shared across every promoter link: one filter for the whole cohort, one campaign umbrella. */
export const INFLUENCER_MEDIUM = "influencer"
export const INFLUENCER_CAMPAIGN = "gnot-ico"

/**
 * One entry per promoter. The handle is BOTH the public path segment and the `utm_source` value,
 * which is what makes each promoter individually attributable. Handles must be lowercase and
 * URL-safe, and must not collide with a real route (path matching is case-sensitive).
 */
export const INFLUENCER_HANDLES = [
  "airdropcosm",
  "enjoymyhobby",
  "airdr0p_lab",
  "lnsanecoin",
] as const

export type InfluencerHandle = (typeof INFLUENCER_HANDLES)[number]

/** Shape of a single redirect rule, matching the framework's redirect-config contract. */
export interface VanityRedirect {
  source: string
  destination: string
  permanent: boolean
}

/**
 * Builds the redirect table: one rule per promoter, `/<handle>` to the root tagged with that
 * promoter's campaign parameters. `permanent: false` keeps the redirect uncached by browsers so
 * a handle can be reassigned mid-campaign without a stale cache pinning the old destination.
 */
export function influencerRedirects(): VanityRedirect[] {
  return INFLUENCER_HANDLES.map((handle) => ({
    source: `/${handle}`,
    destination: `/?utm_source=${encodeURIComponent(handle)}&utm_medium=${INFLUENCER_MEDIUM}&utm_campaign=${INFLUENCER_CAMPAIGN}`,
    permanent: false,
  }))
}
