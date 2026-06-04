import "server-only"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { env } from "../env"
import * as schema from "./schema"

type Db = ReturnType<typeof createDb>

function createDb() {
  // Deferred so importing this module does not read env.DATABASE_URL: `next
  // build` imports route modules to collect page data and must not require the
  // URL to be present. Neon's HTTP driver opens no socket here; the first query
  // does.
  return drizzle(neon(env.DATABASE_URL), { schema })
}

let cachedDb: Db | null = null
function getDb(): Db {
  cachedDb ??= createDb()
  return cachedDb
}

/**
 * Drizzle client, created on first query. A proxy so call sites keep using
 * `db.insert(...)` / `db.select(...)` while construction (and the
 * env.DATABASE_URL read) stays out of module import. Methods are bound to the
 * real client.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb()
    const value = real[prop as keyof Db]
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value
  },
})
