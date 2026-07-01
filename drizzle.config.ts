import { existsSync } from "node:fs"
import type { Config } from "drizzle-kit"

// drizzle-kit doesn't read Next.js `.env.local`; load it for local `migrate`/`studio`.
// Guarded so CI / Netlify (file absent, the DB URL injected into the real env) are unaffected.
if (existsSync(".env.local") && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env.local")
}

// `out` MUST be the directory the Netlify deploy applies migrations from.
// `generate` works offline from the schema alone (all we run in CI / dev).
// A URL is only needed for `migrate`/`studio`; NETLIFY_DB_URL is the Netlify Database (GA)
// connection string, with DATABASE_URL as a manual override for a local/other Postgres.
export default {
  schema: "./lib/db/schema.ts",
  out: "./netlify/database/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? process.env.NETLIFY_DB_URL ?? "" },
} satisfies Config
