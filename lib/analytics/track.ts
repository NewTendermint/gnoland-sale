import { SALE_CHAIN } from "@/lib/sale/contracts"

// Client-side wrapper around Simple Analytics' sa_event. Fire-and-forget: never
// throws, no-ops outside the production mainnet build. Event names are a closed
// union - free-form strings do not compile.
export type AnalyticsEvent =
  | "wallet_connect_started"
  | "wallet_connected"
  | "wallet_connect_failed"
  | "sonar_auth_started"
  | "sonar_auth_completed"
  | "sonar_setup_opened"
  | "wallet_install_clicked"
  | "nav_clicked"
  | "bid_panel_opened"
  | "bid_started"
  | "bid_submitted"
  | "bid_confirmed"
  | "bid_failed"
  | "token_selected"
  | "push_alerts_result"
  | "email_alert_subscribed"
  | "add_to_calendar"
  | "faq_opened"
  | "section_viewed"

export type AnalyticsMetadata = Record<string, string | number | boolean>

// PII firewall: any string value that looks like an address/tx hash (long hex),
// an email or a UUID is dropped before leaving the browser. Simple Analytics
// forbids personal data in metadata (account suspension); our own rules too.
const PII_PATTERNS = [
  /0x[0-9a-f]{16,}/i,
  /[^\s@]+@[^\s@]+\.[^\s@]+/,
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
]

function sanitize(metadata: AnalyticsMetadata): AnalyticsMetadata {
  const clean: AnalyticsMetadata = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string" && PII_PATTERNS.some((p) => p.test(value))) continue
    clean[key] = value
  }
  return clean
}

export function analyticsEnabled(): boolean {
  return process.env.NODE_ENV === "production" && SALE_CHAIN.id === 1
}

type SaEvent = ((...args: unknown[]) => void) & { q?: unknown[][] }

// Official pre-load queue contract: the SA script drains window.sa_event.q on load.
function saEvent(): SaEvent {
  const w = window as Window & { sa_event?: SaEvent }
  if (!w.sa_event) {
    const stub: SaEvent = (...args: unknown[]) => {
      stub.q = stub.q ?? []
      stub.q.push(args)
    }
    w.sa_event = stub
  }
  return w.sa_event
}

export function track(event: AnalyticsEvent, metadata?: AnalyticsMetadata): void {
  try {
    if (!analyticsEnabled() || typeof window === "undefined") return
    const clean = metadata ? sanitize(metadata) : undefined
    if (clean && Object.keys(clean).length > 0) saEvent()(event, clean)
    else saEvent()(event)
  } catch {
    // Analytics must never break the app.
  }
}

export type BidAmountBucket = "lt_100" | "100_500" | "500_1k" | "1k_10k" | "10k_plus"

// Exact amounts are sensitive; only coarse buckets leave the browser.
export function bidAmountBucket(usd: number): BidAmountBucket {
  if (usd < 100) return "lt_100"
  if (usd < 500) return "100_500"
  if (usd < 1_000) return "500_1k"
  if (usd < 10_000) return "1k_10k"
  return "10k_plus"
}
