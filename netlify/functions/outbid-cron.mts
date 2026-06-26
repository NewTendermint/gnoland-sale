// Netlify Scheduled Function: every 5 min, trigger the outbid cron route. Thin by design - no
// server-only imports (those would throw in a plain Node function). The route does the real work in
// the Next server context (DB + Sonar + web-push) and gates itself to the live sale window.
export default async function handler() {
  const base = process.env.URL ?? process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.CRON_SECRET
  if (!base || !secret) return
  await fetch(`${base}/api/push/cron`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  }).catch(() => {})
}

export const config = { schedule: "*/5 * * * *" }
