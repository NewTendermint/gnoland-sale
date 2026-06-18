import { bigint, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
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
    entityId: uuid("entity_id"),
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
