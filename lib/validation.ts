import { z } from "zod"

// EVM address validation (20-byte hex, 0x-prefixed). No `import "server-only"`: drizzle-kit imports this.
export const evmAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/)
