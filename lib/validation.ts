import { z } from "zod"

// EVM address validation (20-byte hex, 0x-prefixed). No `import "server-only"`: drizzle-kit imports this.
// Lowercased on parse: casing is display-only on EVM, and a verbatim mixed-case value would split
// the permit-dedup key and the audit-log wallet index.
export const evmAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform((a) => a.toLowerCase())
