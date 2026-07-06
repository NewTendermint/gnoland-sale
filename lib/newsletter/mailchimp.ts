import "server-only"
import { createHash } from "node:crypto"

// Server-side Mailchimp integration; email is never logged or stored on our side.

export type SubscribeOutcome = "ok" | "upstream-error"

type FetchLike = typeof fetch

// Dev-only mock gate; never in production (prod fails closed on missing creds).
export function mailchimpMockEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false
  if (process.env.MAILCHIMP_MOCK === "1") return true
  return !process.env.MAILCHIMP_API_KEY
}

// Single source for the credential plumbing (dc-suffix parsing, Basic auth, API base) shared by
// the subscribe path and the price campaign sender. null = not configured.
export function mailchimpConfig(): {
  base: string
  audienceId: string
  headers: Record<string, string>
} | null {
  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
  const dc = apiKey?.includes("-") ? apiKey.split("-").pop() : undefined
  if (!apiKey || !audienceId || !dc) return null
  return {
    base: `https://${dc}.api.mailchimp.com/3.0`,
    audienceId,
    headers: {
      authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
      "content-type": "application/json",
    },
  }
}

export async function subscribePending(
  email: string,
  fetchFn: FetchLike = fetch,
): Promise<SubscribeOutcome> {
  if (mailchimpMockEnabled()) return "ok"
  const cfg = mailchimpConfig()
  if (!cfg) return "upstream-error"
  const subscriberHash = createHash("md5").update(email.toLowerCase()).digest("hex")
  try {
    const res = await fetchFn(`${cfg.base}/lists/${cfg.audienceId}/members/${subscriberHash}`, {
      method: "PUT",
      headers: cfg.headers,
      body: JSON.stringify({ email_address: email, status_if_new: "pending" }),
      signal: AbortSignal.timeout(8000),
    })
    // Status code only - the response body can echo the email back.
    if (!res.ok) console.error(`newsletter: mailchimp -> HTTP ${res.status}`)
    return res.ok ? "ok" : "upstream-error"
  } catch (err) {
    // Never rethrow with the email in scope; log the error class only (a fetch/abort message
    // carries no address, but keep it minimal by design).
    console.error(`newsletter: mailchimp -> ${err instanceof Error ? err.name : "error"}`)
    return "upstream-error"
  }
}
