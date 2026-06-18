import "server-only"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { env } from "../env"
import * as schema from "./schema"

type Db = ReturnType<typeof createDb>

function createDb() {
  return drizzle(neon(env.DATABASE_URL), { schema })
}

let cachedDb: Db | null = null
function getDb(): Db {
  cachedDb ??= createDb()
  return cachedDb
}

// Drizzle client, lazily created on first query (keeps env.DATABASE_URL out of import).
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb()
    const value = real[prop as keyof Db]
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value
  },
})
