import { bigint, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { z } from "zod"
import { evmAddress } from "../validation"

// No `import "server-only"` here: drizzle-kit imports this from a plain Node CLI
// (generate/migrate), where the guard would throw. The connection itself
// (lib/db/client.ts) carries it. This file holds only table metadata and a
// validation schema, no secret access.

/**
 * Encrypted OAuth token store, keyed by an opaque session id.
 *
 * `encrypted_tokens` is the libsodium secretbox envelope of
 * `{ accessToken, refreshToken }` (see lib/security/encryption.ts). Plaintext
 * tokens never touch the database or the client.
 */
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

/**
 * Append-only audit trail for permit issuance and other sensitive events.
 *
 * Privacy model (ADR 4.7): wallet and entity id are stored in clear because
 * they are already public on chain; hashing them would be false anonymization
 * (reversible by rainbow table). The client IP, the one non-public field, is
 * stored only as an irreversible HMAC, and the user agent is reduced to a
 * coarse class. `metadata` is held to a strict allow-list (auditMetadataSchema)
 * so no PII can slip into the jsonb column.
 */
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

/**
 * Strict allow-list for the audit_log.metadata jsonb column, validated at write
 * time (lib/sonar/permit.ts). Anything not listed (email, name, full IP, full
 * user agent, raw permit signatures) is rejected before it can be persisted.
 */
export const auditMetadataSchema = z
  .object({
    permit_id_prefix: z.string().max(16).optional(),
    error_code: z.string().max(64).optional(),
    chain_id: z.number().int().optional(),
    payment_token: evmAddress.optional(),
  })
  .strict()

export type AuditMetadata = z.infer<typeof auditMetadataSchema>
