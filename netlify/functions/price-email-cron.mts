// Netlify Scheduled Function: hourly, trigger the price email cron route. Same fan-out pattern
// as outbid-cron (only the PRODUCTION deploy is scheduled; dispatch semantics in
// ../cron-fan-out.mts). Real sends are gated inside the route by EMAIL_ALERTS_ENABLED, so the
// staging leg is a safe dry-run.
import { fanOutCron } from "../cron-fan-out.mts"

export default async function handler() {
  await fanOutCron("price-email-cron", "/api/email/cron")
}

export const config = { schedule: "0 * * * *" }
