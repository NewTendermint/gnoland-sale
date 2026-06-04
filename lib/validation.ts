import { z } from "zod"

/**
 * EVM address validation (20-byte hex, 0x-prefixed). Shared by the Sonar proxy
 * route bodies (bidding wallet) and the audit-log metadata schema (payment-token
 * address) so the pattern can't drift between them.
 *
 * No `import "server-only"`: lib/db/schema.ts (loaded by the drizzle-kit CLI from
 * plain Node) imports this, and it holds only a regex, never a secret.
 */
export const evmAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/)
