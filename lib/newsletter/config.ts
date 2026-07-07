// Whether the newsletter capture UI renders. Prod requires the flag; dev defaults on.
export function newsletterEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_NEWSLETTER_ENABLED === "1") return true
  return process.env.NODE_ENV === "development"
}

// localStorage flag set by ANY NewsletterForm on subscribe success (value only, no address), so
// every surface (footer, tiles, bid panel) shares one "this browser subscribed" signal.
export const EMAIL_OPTIN_STORAGE_KEY = "gnot:email-updates"

export function markEmailOptInDone(): void {
  try {
    localStorage.setItem(EMAIL_OPTIN_STORAGE_KEY, "1")
  } catch {}
}

export function clearEmailOptInDone(): void {
  try {
    localStorage.removeItem(EMAIL_OPTIN_STORAGE_KEY)
  } catch {}
}

export function emailOptInDone(): boolean {
  try {
    return localStorage.getItem(EMAIL_OPTIN_STORAGE_KEY) === "1"
  } catch {
    return false
  }
}
