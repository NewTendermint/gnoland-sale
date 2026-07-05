import {
  bigint,
  doublePrecision,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { z } from "zod"
import { evmAddress } from "../validation"

// No `import "server-only"` here: drizzle-kit imports this from a plain Node CLI.

// Encrypted OAuth token store (libsodium secretbox envelope), keyed by opaque session id.
export const oauthTokens = pgTable(
  "oauth_tokens",
  {
    sessionId: text("session_id").primaryKey(),
    encryptedTokens: text("encrypted_tokens").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("oauth_tokens_expires_at_idx").on(table.expiresAt)],
)

// Append-only audit trail. IP stored only as HMAC; metadata held to a strict allow-list.
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    event: text("event").notNull(),
    // Sonar EntityID is an opaque string (e.g. "AUX-dSHI4...."), NOT a UUID - so this is text, not uuid.
    entityId: text("entity_id"),
    wallet: text("wallet"),
    amountMinor: bigint("amount_minor", { mode: "number" }),
    ipHmac: text("ip_hmac"),
    userAgentClass: text("user_agent_class"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_log_event_idx").on(table.event),
    index("audit_log_created_at_idx").on(table.createdAt),
    index("audit_log_wallet_idx").on(table.wallet),
  ],
)

// Strict allow-list for audit_log.metadata; anything unlisted (PII) is rejected at write.
export const auditMetadataSchema = z
  .object({
    permit_id_prefix: z.string().max(16).optional(),
    error_code: z.string().max(64).optional(),
    chain_id: z.number().int().optional(),
    payment_token: evmAddress.optional(),
  })
  .strict()

export type AuditMetadata = z.infer<typeof auditMetadataSchema>

// Web Push subscriptions, keyed by the push endpoint. Deliberately UN-traceable: no session id,
// wallet, entity id, email, or IP - only the push channel + a price + status. Purge after the sale closes.
export const pushSubscriptions = pgTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  bidLimitUsd: doublePrecision("bid_limit_usd").notNull(),
  lastStatus: text("last_status").notNull().default("winning"), // "winning" | "outbid"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// Price email cron state: one row (id=1). Absent row = first run (baseline gets recorded);
// lastSentAt null = baseline only, no email sent yet.
export const priceEmailState = pgTable("price_email_state", {
  id: smallint("id").primaryKey(),
  lastSentPriceUsd: doublePrecision("last_sent_price_usd").notNull(),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
})

// A push endpoint only ever comes from a browser's PushManager, so its host is always one of the
// major providers. Restricting to that allowlist stops an attacker from registering an endpoint at
// an arbitrary host that the outbid cron would then POST to every 5 min (SSRF / amplification).
const PUSH_ENDPOINT_HOSTS = [
  "push.services.mozilla.com", // Firefox
  "fcm.googleapis.com", // Chrome / Chromium (FCM)
  "notify.windows.com", // Edge / Windows (WNS)
  "push.apple.com", // Safari
]

function isPushProviderEndpoint(endpoint: string): boolean {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return false
  }
  if (url.protocol !== "https:") return false
  return PUSH_ENDPOINT_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
}

// Validates the client-sent subscription before insert. `.strict()` rejects any extra field, so no
// wallet/session/PII can be smuggled into the row; the endpoint must be https AND a known push host.
export const pushSubscriptionInsertSchema = z
  .object({
    endpoint: z
      .string()
      .max(2048)
      .refine(isPushProviderEndpoint, "endpoint is not a known push-service host"),
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(256),
    bidLimitUsd: z.number().positive(),
  })
  .strict()

// Ephemeral OAuth PKCE state. Single-use (deleted on consume), TTL enforced on read via expires_at.
// No PII; verifier is a throwaway nonce.
// Expired/abandoned rows swept daily by /api/db/cleanup (consumed rows self-delete on consume).
export const pkceStates = pgTable(
  "pkce_states",
  {
    state: text("state").primaryKey(),
    sessionId: text("session_id").notNull(),
    codeVerifier: text("code_verifier").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("pkce_states_expires_at_idx").on(table.expiresAt)],
)
