// Netlify Scheduled Function: every 5 min, trigger the outbid cron route. Netlify only schedules the
// PRODUCTION deploy (never branch-deploys/previews), so this one prod run fans out to every deploy
// that owns a SEPARATE database: each target's own /api/push/cron reads that deploy's clearing price
// + subscriptions and sends via that deploy's own web-push keys. Thin by design - no server-only
// imports (they throw in a plain Node function); the route does the real work in the Next server
// context and gates itself to the live sale window. Requires the SAME CRON_SECRET value in every
// targeted context. The staging fan-out URL comes from CRON_STAGING_URL, set on the PRODUCTION
// context (only prod is scheduled); unset -> the staging leg is simply skipped.
const TARGETS = [
  // CRON_PROD_URL overrides while sale.gno.land DNS is not on Netlify (URL = the unreachable custom domain).
  process.env.CRON_PROD_URL ?? process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  process.env.CRON_STAGING_URL, // staging branch-deploy (own Sepolia DB)
]

export default async function handler() {
  const secret = process.env.CRON_SECRET
  if (!secret) return
  await Promise.all(
    [...new Set(TARGETS.filter(Boolean))].map(async (base) => {
      const res = await fetch(`${base}/api/push/cron`, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}` },
      }).catch(() => null)
      // Log non-2xx so a wrong secret / access-gated staging leg is visible in the function logs.
      if (!res?.ok) console.error(`outbid-cron: ${base} -> ${res?.status ?? "unreachable"}`)
    }),
  )
}

export const config = { schedule: "*/5 * * * *" }
