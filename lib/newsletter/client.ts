import { HttpError } from "../sale/api"

// Posts email + honeypot field to POST /api/newsletter (our route, not Mailchimp).
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
