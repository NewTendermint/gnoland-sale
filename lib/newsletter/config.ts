/**
 * Whether the newsletter capture UI renders. Client-safe: NEXT_PUBLIC_* values
 * are inlined at build time. Production requires the explicit flag, so unsetting
 * it is a clean kill switch (the spec's reversibility rule); development defaults
 * on so the running dev server shows the form without an env/restart dance (the
 * server side auto-mocks Mailchimp while no credentials are set).
 */
export function newsletterEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED === "1") return true
  return process.env.NODE_ENV === "development"
}
