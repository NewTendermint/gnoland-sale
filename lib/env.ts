import "server-only"
import { z } from "zod"

/**
 * Server-side environment contract.
 *
 * Imported for its side effect at server start: a missing or malformed secret
 * fails the boot loudly instead of surfacing as an opaque runtime error mid
 * request (and mid auction). Never import this from a Client Component, the
 * `server-only` guard above enforces that at build time.
 */
export const envSchema = z.object({
  // Sonar OAuth + sale identity. Public identifiers rather than secrets, but
  // still server-held so they never widen the client bundle.
  SONAR_CLIENT_UUID: z.string().min(1),
  SONAR_REDIRECT_URI: z.url(),
  SONAR_SALE_UUID: z.string().min(1),
  SONAR_API_BASE_URL: z.url(),
  // 32-byte hex. libsodium secretbox key for OAuth-token-at-rest encryption.
  ENCRYPTION_KEY: z.string().length(64),
  // 32-byte hex. HMAC-SHA256 pepper for irreversible IP hashing in the audit
  // log. IPs are not on chain, so this is the one field we must not store raw.
  IP_HMAC_PEPPER: z.string().length(64),
  // iron-session cookie sealing password.
  SESSION_PASSWORD: z.string().min(32),
  // Netlify DB (Neon) connection string.
  DATABASE_URL: z.url(),
  // Runtime kill switch. A string enum because process env values are strings.
  SALE_PAUSED: z.enum(["true", "false"]).default("false"),
  // Which chain this deployment targets. Drives the audit chain_id (and any
  // server-side chain branching) from a validated, server-only source rather
  // than a public URL. Defaults to testnet so a misconfigured prod mislabels
  // toward sandbox, never falsely claims mainnet.
  SALE_CHAIN: z.enum(["base", "base-sepolia"]).default("base-sepolia"),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate an environment source. The thrown message is deliberately terse: it
 * must never echo the offending value, which may be a secret. Zod's detailed
 * issue list is intentionally discarded for that reason.
 */
export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = envSchema.safeParse(source)
  if (!parsed.success) {
    throw new Error("Invalid environment variables")
  }
  return parsed.data
}

let cachedEnv: Env | null = null

/**
 * Validated environment, lazily. Validation runs on first property access (the
 * first real request), NOT at module import: `next build` collects page data by
 * importing the route modules, and that import must not require the secrets to
 * be present. The first actual use still fails fast if the env is misconfigured.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    cachedEnv ??= parseEnv()
    return cachedEnv[prop as keyof Env]
  },
})
