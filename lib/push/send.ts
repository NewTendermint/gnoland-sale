import "server-only"
import * as webpush from "web-push"
import { env } from "../env"
import { SALE_ECONOMICS } from "../sale/economics"

let configured = false
// Lazily wire VAPID once. Returns false when push is not configured (env absent) so callers no-op.
function ensureVapid(): boolean {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false
  if (!configured) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT ?? "mailto:notifications@gno.land",
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    )
    configured = true
  }
  return true
}

// Generic, PII-free payload. The SW renders title/body and forces the click target same-origin.
const OUTBID_PAYLOAD = JSON.stringify({
  title: "You've been outbid",
  body: "Open the GNOT sale to raise your bid.",
  url: "/",
})

export type SendTarget = { endpoint: string; p256dh: string; auth: string }

const MAX_OUTBID_TTL_S = 6 * 60 * 60

// Outbid pushes fire once per winning->outbid transition (debounced via lastStatus), so a short TTL
// would permanently drop the alert for a briefly-offline user. Cap it instead to the time left
// before the sale closes (an outbid alert is meaningless after that), clamped at 6h so a push
// service never holds a stale alert for days.
function outbidTtlSeconds(now: number): number {
  const saleCloseMs = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
  return Math.max(0, Math.min(Math.floor((saleCloseMs - now) / 1000), MAX_OUTBID_TTL_S))
}

// Sends the outbid push to each target in parallel. Returns endpoints the push service reports as
// gone (404/410) for the caller to delete; transient errors are swallowed (the next run retries).
export async function sendOutbidNotifications(
  targets: SendTarget[],
): Promise<{ sent: number; expiredEndpoints: string[] }> {
  if (!ensureVapid()) return { sent: 0, expiredEndpoints: [] }
  // Options, not the default: an unset TTL defaults to 4 weeks (stale alerts) and an unset timeout
  // lets one stalled socket hang the cron's Promise.all until Netlify kills the function.
  const options = { TTL: outbidTtlSeconds(Date.now()), urgency: "high" as const, timeout: 5000 }
  const expiredEndpoints: string[] = []
  let sent = 0
  await Promise.all(
    targets.map(async (t) => {
      try {
        await webpush.sendNotification(
          { endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } },
          OUTBID_PAYLOAD,
          options,
        )
        sent++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          expiredEndpoints.push(t.endpoint)
        } else {
          // Host only, never the full endpoint (it is a capability URL). A silent 403 cost us
          // a full debugging day on 2026-07-05 - every non-prune failure now leaves a trace.
          // The URL parse is guarded: one malformed row must never reject the whole batch.
          let host = "unparseable-endpoint"
          try {
            host = new URL(t.endpoint).hostname
          } catch {}
          console.error(`push-send: ${host} -> ${status ?? "network"}`)
        }
      }
    }),
  )
  return { sent, expiredEndpoints }
}
