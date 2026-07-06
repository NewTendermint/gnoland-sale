// Netlify Scheduled Function: daily DB hygiene, 03:00 UTC. Netlify only schedules the PRODUCTION
// deploy (never branch-deploys/previews), so this one prod run fans out to every deploy that owns a
// SEPARATE database: each target's own /api/db/cleanup runs the DELETEs against that deploy's own
// NETLIFY_DB_URL (prod route -> prod DB, staging route -> staging DB). Thin by design - no
// server-only imports (they throw in a plain Node function); the route does the real work.
// Requires the SAME CRON_SECRET value in every targeted context. The staging fan-out URL comes from
// CRON_STAGING_URL, set on the PRODUCTION context (only prod is scheduled); unset -> staging skipped.
const TARGETS = [
  // CRON_PROD_URL overrides while sale.gno.land DNS is not on Netlify (URL = the unreachable custom domain).
  process.env.CRON_PROD_URL ?? process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  process.env.CRON_STAGING_URL, // staging branch-deploy (own Sepolia DB)
]

export default async function handler() {
  const secret = process.env.CRON_SECRET
  if (!secret) return
  const failures = (
    await Promise.all(
      [...new Set(TARGETS.filter(Boolean))].map(async (base) => {
        const res = await fetch(`${base}/api/db/cleanup`, {
          method: "POST",
          headers: { authorization: `Bearer ${secret}` },
        }).catch(() => null)
        if (res?.ok) return null
        // Log non-2xx so a wrong secret / access-gated staging leg is visible in the function logs.
        const msg = `db-cleanup: ${base} -> ${res?.status ?? "unreachable"}`
        console.error(msg)
        return msg
      }),
    )
  ).filter((msg): msg is string => msg !== null)
  if (failures.length > 0) throw new Error(failures.join("; "))
}

export const config = { schedule: "0 3 * * *" }
