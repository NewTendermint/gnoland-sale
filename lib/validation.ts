import { z } from "zod"

/**
 * Single source of truth for EVM address validation (20-byte hex, 0x-prefixed).
 * Used by the Sonar proxy route bodies (the bidding wallet) and the audit-log
 * metadata schema (the payment-token address), so the pattern cannot drift
 * between the places that gate on it.
 *
 * No `import "server-only"`: lib/db/schema.ts (loaded by the drizzle-kit CLI from
 * plain Node) imports this, and it holds only a regex, never a secret.
 */
export const evmAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/)
