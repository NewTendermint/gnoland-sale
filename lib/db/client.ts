import "server-only"
import { drizzle } from "drizzle-orm/netlify-db"
import * as schema from "./schema"

type Db = ReturnType<typeof createDb>

// The netlify-db adapter reads NETLIFY_DB_URL when drizzle() is called and THROWS if it's unset.
// Defer that call so importing `db` never connects: modules that import it for non-DB code paths
// (mocked sale/newsletter flows, unit tests) must not blow up at import. Connection materializes
// on first query. NETLIFY_DB_URL is auto-injected on Netlify; set it in .env.local for local dev.
function createDb() {
  return drizzle({ schema })
}

let cachedDb: Db | null = null
function getDb(): Db {
  // Captures NETLIFY_DB_URL once per warm instance: the netlify-db adapter has no rotation
  // handling, so a credential rotation needs a redeploy to reach already-warm instances.
  cachedDb ??= createDb()
  return cachedDb
}

// Drizzle client, lazily created on first query (keeps the NETLIFY_DB_URL lookup out of import).
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb()
    const value = real[prop as keyof Db]
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value
  },
})
