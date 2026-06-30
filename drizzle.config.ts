import { existsSync } from "node:fs"
import type { Config } from "drizzle-kit"

// drizzle-kit doesn't read Next.js `.env.local`; load it for local `migrate`/`studio`.
// Guarded so CI / Netlify (file absent, DATABASE_URL injected into the real env) are unaffected.
if (existsSync(".env.local") && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local")
}

// DATABASE_URL is only needed for `migrate`/`studio`; `generate` works offline
// from the schema alone, which is all we run in CI and during development.
export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? process.env.NETLIFY_DATABASE_URL ?? "" },
} satisfies Config
