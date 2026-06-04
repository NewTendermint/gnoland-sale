import type { Config } from "drizzle-kit"

// DATABASE_URL is only needed for `migrate`/`studio`; `generate` works offline
// from the schema alone, which is all we run in CI and during development.
export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
} satisfies Config
