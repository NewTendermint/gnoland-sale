import "server-only"
import { createHash } from "node:crypto"

/**
 * Server-side Mailchimp Marketing API integration for the newsletter capture.
 * Our UI never talks to Mailchimp: the browser posts to /api/newsletter and this
 * module makes the one upstream call. The email is never logged and never stored
 * on our side; Mailchimp is the only data holder (spec 2026-06-12 §4.5).
 *
 * Upstream contract (verified 2026-06-12 against official sources):
 * - Upsert: PUT https://<dc>.api.mailchimp.com/3.0/lists/{audienceId}/members/{subscriberHash}
 *   (developer.mailchimp.com, "Add or update list member").
 * - subscriberHash = MD5 of the lowercase email (mailchimp-marketing-node README).
 *   MD5 is Mailchimp's resource-id scheme here, not a security control.
 * - Auth: HTTP Basic, any username + the API key; datacenter = the API key's
 *   suffix after the last dash, e.g. key "...-us6" -> us6.api.mailchimp.com
 *   (developer.mailchimp.com fundamentals).
 * - `status_if_new: "pending"` enrolls NEW members into the double opt-in
 *   confirmation flow (mailchimp.com/help/about-double-opt-in) and leaves an
 *   existing member's status untouched, so duplicate submits never re-confirm
 *   or downgrade anyone. NOTE: confirm the pending -> confirmation-email behavior
 *   in the B28 smoke test with real credentials before launch.
 */

export type SubscribeOutcome = "ok" | "upstream-error"

type FetchLike = typeof fetch

/**
 * Dev-only mock gate, mirroring sonarMockEnabled: never in production; explicit
 * MAILCHIMP_MOCK=1 forces it; and with no API key configured (pre-B28) dev/test
 * mock by default so the form is exercisable end to end. Production with missing
 * credentials answers upstream-error (fail closed), never fake success.
 */
function mailchimpMockEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false
  if (process.env.MAILCHIMP_MOCK === "1") return true
  return !process.env.MAILCHIMP_API_KEY
}

/** Upsert the address into the audience as a pending (double opt-in) member. */
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
        // Serverless hygiene: never hang a function on a slow upstream.
        signal: AbortSignal.timeout(8000),
      },
    )
    return res.ok ? "ok" : "upstream-error"
  } catch {
    // Network/timeout/abort: generic. Never rethrow with the email in scope.
    return "upstream-error"
  }
}
