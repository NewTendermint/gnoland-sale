import "server-only"
import { sql } from "drizzle-orm"
import { db } from "./client"
import { cronLeases } from "./schema"

// Cron overlap guard. One conditional upsert on DB time (no lambda clock trust):
// - no row yet -> inserted, acquired
// - expired lease -> updated, acquired
// - live lease -> the setWhere filters the update out, zero rows returned, NOT acquired
// A crashed run never releases; its lease simply expires at TTL.

// Must cover the longest legitimate run yet stay under the shortest schedule tick (5 min), so a
// crashed run can never eat more than one tick.
export const CRON_LEASE_TTL_S = 240

/** Try to take the named lease for ttlSeconds. False = another run holds it. */
export async function acquireCronLease(name: string, ttlSeconds: number): Promise<boolean> {
  const until = sql`now() + make_interval(secs => ${ttlSeconds})`
  const rows = await db
    .insert(cronLeases)
    .values({ name, leasedUntil: until })
    .onConflictDoUpdate({
      target: cronLeases.name,
      set: { leasedUntil: until },
      setWhere: sql`${cronLeases.leasedUntil} < now()`,
    })
    .returning({ name: cronLeases.name })
  return rows.length > 0
}

/** Release after the run finishes (any completed or thrown path; only a process death skips this,
 *  and then the TTL covers it). Never throws - a failed release must not mask the run's outcome. */
export async function releaseCronLease(name: string): Promise<void> {
  try {
    await db
      .update(cronLeases)
      .set({ leasedUntil: sql`now()` })
      .where(sql`${cronLeases.name} = ${name}`)
  } catch {
    // best-effort: TTL expiry covers a failed release
  }
}
