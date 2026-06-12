/**
 * Browser-side fetcher for the newsletter capture. The browser only ever talks
 * to our own route; the Mailchimp credentials and upstream call stay server-side
 * (lib/newsletter/mailchimp.ts).
 */
import { HttpError } from "../sale/api"

/** Submit an address (plus the honeypot field) to POST /api/newsletter. */
export async function postNewsletterSubscribe(email: string, topic: string): Promise<void> {
  const res = await fetch("/api/newsletter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, topic }),
  })
  if (!res.ok) {
    throw new HttpError(res.status, `/api/newsletter responded ${res.status}`)
  }
}
