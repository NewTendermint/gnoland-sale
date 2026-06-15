import "server-only"
import { z } from "zod"

/**
 * Server-side environment contract. A missing or malformed secret fails the
 * boot instead of surfacing as an opaque runtime error mid request. The
 * `server-only` guard above keeps it out of any Client Component.
 */
const envSchema = z.object({
  // Sonar OAuth + sale identity. Public identifiers rather than secrets, but
  // still server-held so they never widen the client bundle.
  SONAR_CLIENT_UUID: z.string().min(1),
  SONAR_REDIRECT_URI: z.url(),
  SONAR_SALE_UUID: z.string().min(1),
  SONAR_API_BASE_URL: z.url(),
  // 32-byte hex. libsodium secretbox key for OAuth-token-at-rest encryption.
  // Regex not just length(): a non-hex 64-char value would pass length() yet
  // throw at the first sodium.from_hex, so validate the charset at boot.
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/),
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
  // toward sandbox rather than falsely claiming mainnet.
  SALE_CHAIN: z.enum(["mainnet", "sepolia"]).default("sepolia"),
  // Newsletter (Mailchimp). Optional: the feature degrades cleanly when absent
  // (the form is flag-gated, dev mocks the API, prod answers 502), so booting
  // without them is valid. An EMPTY string (the .env.example default a dev will
  // copy) is normalized to absent rather than failing the whole env at boot.
  // Read sites use process.env directly (mock-config precedent) to stay
  // test-mutable; these entries document the contract.
  MAILCHIMP_API_KEY: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  MAILCHIMP_AUDIENCE_ID: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate an environment source. The thrown message stays terse and Zod's
 * detailed issue list is discarded: neither must echo the offending value,
 * which may be a secret.
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
 * Validated environment, lazily. Validation runs on first property access, not
 * at module import: `next build` collects page data by importing the route
 * modules, and that import must not require the secrets to be present. The
 * first real use still fails fast if the env is misconfigured.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    cachedEnv ??= parseEnv()
    return cachedEnv[prop as keyof Env]
  },
})
