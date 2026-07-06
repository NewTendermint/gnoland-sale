// Netlify Scheduled Function: daily DB hygiene, 03:00 UTC. Netlify only schedules the PRODUCTION
// deploy (never branch-deploys/previews), so this one prod run fans out to every deploy that owns a
// SEPARATE database: each target's own /api/db/cleanup runs the DELETEs against that deploy's own
// NETLIFY_DB_URL (prod route -> prod DB, staging route -> staging DB). Thin by design - no
// server-only imports (they throw in a plain Node function); the route does the real work.
// Requires the SAME CRON_SECRET value in every targeted context. Target resolution and run-status
// semantics (prod leg throws, staging leg logs) live in ../cron-fan-out.mts.
import { fanOutCron } from "../cron-fan-out.mts"

export default async function handler() {
  await fanOutCron("db-cleanup", "/api/db/cleanup")
}

export const config = { schedule: "0 3 * * *" }
