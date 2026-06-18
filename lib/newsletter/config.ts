// Whether the newsletter capture UI renders. Prod requires the flag; dev defaults on.
export function newsletterEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED === "1") return true
  return process.env.NODE_ENV === "development"
}
