import "server-only"
import { priceEmailHtml, priceEmailSubject } from "../../content/emails/price-alert"
import { mailchimpConfig, mailchimpMockEnabled } from "./mailchimp"

// One-shot Mailchimp price campaign: create -> set content -> send. No member data touched;
// failures surface the step + HTTP status (0 = not configured / network / timeout) so the cron
// log tells the whole story without ever throwing through the route.
export type CampaignOutcome =
  | { outcome: "ok"; campaignId: string }
  | { outcome: "error"; step: "create" | "content" | "send"; status: number }

export async function sendPriceCampaign(
  priceUsd: number,
  fetchFn: typeof fetch = fetch,
): Promise<CampaignOutcome> {
  if (mailchimpMockEnabled()) return { outcome: "ok", campaignId: "mock" }
  const cfg = mailchimpConfig()
  if (!cfg) return { outcome: "error", step: "create", status: 0 }
  let step: "create" | "content" | "send" = "create"
  try {
    const create = await fetchFn(`${cfg.base}/campaigns`, {
      method: "POST",
      headers: cfg.headers,
      body: JSON.stringify({
        type: "regular",
        recipients: { list_id: cfg.audienceId },
        settings: {
          subject_line: priceEmailSubject(priceUsd),
          title: `price-alert-${Date.now()}`,
          // `||` (not ??) so an empty-string env value still falls back to a valid sender.
          // The fallback MUST be a Mailchimp-verified sender or the send step 400s.
          from_name: process.env.MAILCHIMP_FROM_NAME || "Sale Gno.land",
          reply_to: process.env.MAILCHIMP_REPLY_TO || "tokensale@newtendermint.org",
        },
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!create.ok) return { outcome: "error", step, status: create.status }
    const campaignId = ((await create.json()) as { id: string }).id
    step = "content"
    const content = await fetchFn(`${cfg.base}/campaigns/${campaignId}/content`, {
      method: "PUT",
      headers: cfg.headers,
      body: JSON.stringify({ html: priceEmailHtml(priceUsd) }),
      signal: AbortSignal.timeout(8000),
    })
    if (!content.ok) return { outcome: "error", step, status: content.status }
    step = "send"
    const send = await fetchFn(`${cfg.base}/campaigns/${campaignId}/actions/send`, {
      method: "POST",
      headers: cfg.headers,
      signal: AbortSignal.timeout(8000),
    })
    if (!send.ok) return { outcome: "error", step, status: send.status }
    return { outcome: "ok", campaignId }
  } catch {
    // Network failure, 8s timeout, or a malformed create body: report the step, never throw.
    return { outcome: "error", step, status: 0 }
  }
}
