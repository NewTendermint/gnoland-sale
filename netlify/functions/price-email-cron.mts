// Netlify Scheduled Function: hourly, trigger the price email cron route. Same fan-out pattern
// as outbid-cron (only the PRODUCTION deploy is scheduled). Real sends are gated inside the
// route by EMAIL_ALERTS_ENABLED, so the staging leg is a safe dry-run.
const TARGETS = [
  process.env.CRON_PROD_URL ?? process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL,
  process.env.CRON_STAGING_URL,
]

export default async function handler() {
  const secret = process.env.CRON_SECRET
  if (!secret) return
  await Promise.all(
    [...new Set(TARGETS.filter(Boolean))].map(async (base) => {
      const res = await fetch(`${base}/api/email/cron`, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}` },
      }).catch(() => null)
      if (!res?.ok) console.error(`price-email-cron: ${base} -> ${res?.status ?? "unreachable"}`)
    }),
  )
}

export const config = { schedule: "0 * * * *" }
