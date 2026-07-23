import { SALE_CHAIN } from "@/lib/sale/contracts"
import { resolveAttributionHandle } from "./influencer-links"

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
  | "wallet_disconnected"
  | "bid_precheck_blocked"
  | "sonar_auth_failed"

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

// Bid-funnel events carry the promoter attribution, so Simple Analytics can break the funnel down
// by influencer. Every other event is left untagged.
const ATTRIBUTED_EVENTS = new Set<AnalyticsEvent>(["bid_started", "bid_submitted", "bid_confirmed"])

/**
 * The influencer handle to attach to a funnel event, from the raw attribution cookie value. Returns
 * a handle ONLY for a funnel event AND a value that is a known promoter (resolveAttributionHandle),
 * so a tampered cookie can never inject an arbitrary SA dimension. Pure - the cookie read is split
 * out below - and unit-tested in isolation.
 */
export function attributionSourceFor(
  event: AnalyticsEvent,
  rawCookie: string | null,
): string | null {
  if (!ATTRIBUTED_EVENTS.has(event)) return null
  return resolveAttributionHandle(rawCookie)
}

// First-party attribution cookie value (a public promoter handle, no secret). The name carries the
// `__Host-` prefix in production (set by the middleware); the pattern matches either form.
function readAttributionCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)(?:__Host-)?gnot_attr=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function track(event: AnalyticsEvent, metadata?: AnalyticsMetadata): void {
  try {
    if (!analyticsEnabled() || typeof window === "undefined") return
    // Attach the promoter source to funnel events (no-op for others / untagged visitors). The
    // handle passes the PII firewall (a slug), and it is always merged BEFORE sanitize runs. The
    // cookie is read only for funnel events, so the ~21 other event types skip the DOM read.
    const source = ATTRIBUTED_EVENTS.has(event)
      ? attributionSourceFor(event, readAttributionCookie())
      : null
    const enriched: AnalyticsMetadata | undefined = source ? { ...metadata, source } : metadata
    const clean = enriched ? sanitize(enriched) : undefined
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

// A closed taxonomy of bid/precheck failure causes. A bid can fail for a compliance/eligibility
// reason (decided off-app by the sale platform) or an on-chain/wallet reason (decided in the
// browser). Keeping them as distinct slugs is what lets a dashboard tell "the platform blocked
// this wallet" apart from "the user rejected the signature" - the whole point of this taxonomy.
export type BidFailCode =
  | "user-rejected"
  | "tx-replaced"
  | "wrong-chain"
  | "not-connected"
  | "insufficient-eth-gas"
  | "insufficient-token"
  | "price-range"
  | "amount-range"
  | "lockup-required"
  | "cannot-lower"
  | "permit-expired"
  | "sale-window"
  | "wallet-tied"
  | "wallet-not-linked"
  | "missing-permit"
  | "approval-reverted"
  | "tx-reverted"
  | "already-in-progress"
  | "session-expired"
  | "entity-not-eligible"
  | "wallet-risk"
  | "max-wallets-used"
  | "requires-liveness"
  | "sale-not-active"
  | "outside-time-window"
  | "generic"

// Reasons that are already stable slugs or fixed sentinels at their source: mapped by exact
// identity so they keep their historical analytics label. Everything else is a human line and
// is matched by pattern below.
const EXACT_FAIL_CODES: Record<string, BidFailCode> = {
  "wrong-chain": "wrong-chain",
  "Connect your wallet": "not-connected",
  "session-expired": "session-expired",
  "entity-not-eligible": "entity-not-eligible",
  "wallet-risk": "wallet-risk",
  "max-wallets-used": "max-wallets-used",
  "requires-liveness": "requires-liveness",
  "sale-not-active": "sale-not-active",
  "wallet-not-linked": "wallet-not-linked",
  "outside-time-window": "outside-time-window",
  unknown: "generic",
}

// Human failure lines -> code. Ordered, first match wins; each pattern targets a phrase specific
// enough that no two arms overlap. The balance arm is token-templated ("Insufficient USDC/USDT
// balance.") so it matches on shape, not a fixed symbol.
const FAIL_PATTERNS: ReadonlyArray<readonly [RegExp, BidFailCode]> = [
  [/cancelled the (signature|transaction)/i, "user-rejected"],
  [/transaction was replaced/i, "tx-replaced"],
  [/Not enough ETH/i, "insufficient-eth-gas"],
  [/^Insufficient .+ balance\.$/i, "insufficient-token"],
  [/price is outside/i, "price-range"],
  [/amount is outside/i, "amount-range"],
  [/must include the lockup/i, "lockup-required"],
  [/only be raised/i, "cannot-lower"],
  [/authorization expired/i, "permit-expired"],
  [/sale isn't (accepting bids|open)/i, "sale-window"],
  [/already linked to another/i, "wallet-tied"],
  [/isn't linked to your verified identity/i, "wallet-not-linked"],
  [/Missing purchase permit/i, "missing-permit"],
  [/approval transaction failed/i, "approval-reverted"],
  [/bid transaction failed on-chain/i, "tx-reverted"],
  [/bid is already in progress/i, "already-in-progress"],
]

// Classify a bid/precheck failure reason (a Sonar/sentinel code or an on-chain human line) into a
// stable slug for analytics. Unmatched input is "generic" - the guard test asserts every real
// producer line matches, so "generic" only ever reflects a genuinely unknown error.
export function bidFailureCode(reason: string): BidFailCode {
  // hasOwn, not a bare lookup: a plain object inherits "toString"/"constructor" etc., which would
  // otherwise return a truthy prototype member for those reason values.
  if (Object.hasOwn(EXACT_FAIL_CODES, reason)) return EXACT_FAIL_CODES[reason]
  for (const [pattern, code] of FAIL_PATTERNS) {
    if (pattern.test(reason)) return code
  }
  return "generic"
}

// Bucket a wallet-connect error by its class name and EIP-1193 code. The raw message is never
// read: it can carry an address and its wording is unstable across wallets. Injected wallets
// often surface a raw provider error (not viem's typed class), so the numeric code is matched
// too: 4001 = user rejected, -32002 = a request is already pending.
export function connectFailureBucket(err: unknown): string {
  const e = (err ?? {}) as { name?: unknown; code?: unknown }
  const name = typeof e.name === "string" ? e.name : ""
  const code = typeof e.code === "number" ? e.code : undefined
  if (name === "UserRejectedRequestError" || code === 4001) return "user-rejected"
  if (name === "ConnectorAlreadyConnectedError") return "already-connected"
  if (name === "ResourceUnavailableRpcError" || code === -32002) return "resource-unavailable"
  return "other"
}

// Decide whether a wagmi onConnect is a real user connection worth tracking. A silent
// auto-reconnect on page load (isReconnected) is skipped so it does not inflate connect-success.
// Returned so the caller stays a trivial one-liner and the gating logic is unit-testable in
// isolation (the connect signal is dropped if fired from the unmounting connect UI, so the caller
// lives at the provider level instead).
export function walletConnectedEvent(data: {
  connector?: { id?: string }
  isReconnected: boolean
}): { event: "wallet_connected"; metadata: { connector: string } } | null {
  if (data.isReconnected) return null
  return { event: "wallet_connected", metadata: { connector: data.connector?.id ?? "unknown" } }
}
