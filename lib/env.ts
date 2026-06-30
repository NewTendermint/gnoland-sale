import "server-only"
import { z } from "zod"

// Server-side environment contract; a missing or malformed secret fails the boot.
const envSchema = z.object({
  SONAR_CLIENT_UUID: z.string().min(1),
  SONAR_REDIRECT_URI: z.url(),
  SONAR_SALE_UUID: z.string().min(1),
  SONAR_API_BASE_URL: z.url(),
  // 32-byte hex. Regex (not length) so a non-hex value fails at boot, not at from_hex.
  ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/),
  IP_HMAC_PEPPER: z.string().length(64),
  SESSION_PASSWORD: z.string().min(32),
  DATABASE_URL: z.url(),
  SALE_PAUSED: z.enum(["true", "false"]).default("false"),
  // Defaults to testnet so a misconfigured prod mislabels toward sandbox, not mainnet.
  SALE_CHAIN: z.enum(["mainnet", "sepolia"]).default("sepolia"),
  // Optional; empty string is normalized to absent.
  MAILCHIMP_API_KEY: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  MAILCHIMP_AUDIENCE_ID: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  // Web Push (VAPID). Optional: absent = push off. Private key server-only, never NEXT_PUBLIC_.
  VAPID_PUBLIC_KEY: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  VAPID_PRIVATE_KEY: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  VAPID_SUBJECT: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  // Bearer secret protecting the scheduled outbid-cron route. Optional: absent = cron disabled.
  CRON_SECRET: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
})

export type Env = z.infer<typeof envSchema>

// Validate an environment source. Error stays terse: never echo the value (may be a secret).
export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  // Netlify Database (GA) injects NETLIFY_DATABASE_URL; alias it to our DATABASE_URL.
  const normalized = { ...source, DATABASE_URL: source.DATABASE_URL ?? source.NETLIFY_DATABASE_URL }
  const parsed = envSchema.safeParse(normalized)
  if (!parsed.success) {
    throw new Error("Invalid environment variables")
  }
  return parsed.data
}

let cachedEnv: Env | null = null

// Validated environment, lazily on first property access (keeps secrets out of import).
export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    cachedEnv ??= parseEnv()
    return cachedEnv[prop as keyof Env]
  },
})
