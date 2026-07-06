// Netlify Scheduled Function: every 5 min, trigger the outbid cron route. Netlify only schedules the
// PRODUCTION deploy (never branch-deploys/previews), so this one prod run fans out to every deploy
// that owns a SEPARATE database: each target's own /api/push/cron reads that deploy's clearing price
// + subscriptions and sends via that deploy's own web-push keys. Thin by design - no server-only
// imports (they throw in a plain Node function); the route does the real work in the Next server
// context and gates itself to the live sale window. Requires the SAME CRON_SECRET value in every
// targeted context. Target resolution and run-status semantics (prod leg throws, staging leg logs)
// live in ../cron-fan-out.mts.
import { fanOutCron } from "../cron-fan-out.mts"

export default async function handler() {
  await fanOutCron("outbid-cron", "/api/push/cron")
}

export const config = { schedule: "*/5 * * * *" }
