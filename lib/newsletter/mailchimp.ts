import "server-only"
import { createHash } from "node:crypto"

// Server-side Mailchimp integration; email is never logged or stored on our side.

export type SubscribeOutcome = "ok" | "upstream-error"

type FetchLike = typeof fetch

// Dev-only mock gate; never in production (prod fails closed on missing creds).
function mailchimpMockEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false
  if (process.env.MAILCHIMP_MOCK === "1") return true
  return !process.env.MAILCHIMP_API_KEY
}

export async function subscribePending(
  email: string,
  fetchFn: FetchLike = fetch,
): Promise<SubscribeOutcome> {
  if (mailchimpMockEnabled()) return "ok"
  const apiKey = process.env.MAILCHIMP_API_KEY
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID
  const dc = apiKey?.includes("-") ? apiKey.split("-").pop() : undefined
  if (!apiKey || !audienceId || !dc) return "upstream-error"
  const subscriberHash = createHash("md5").update(email.toLowerCase()).digest("hex")
  try {
    const res = await fetchFn(
      `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`,
      {
        method: "PUT",
        headers: {
          authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ email_address: email, status_if_new: "pending" }),
        signal: AbortSignal.timeout(8000),
      },
    )
    return res.ok ? "ok" : "upstream-error"
  } catch {
    // Never rethrow with the email in scope.
    return "upstream-error"
  }
}
