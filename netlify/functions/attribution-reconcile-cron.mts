// Netlify Scheduled Function: hourly, trigger the influencer-attribution reconcile route. Same
// fan-out pattern as the other crons (only the PRODUCTION deploy is scheduled; ../cron-fan-out.mts
// pokes staging's own route too, since prod and staging own separate databases). The route is
// read-only on-chain, so the staging leg is harmless.
import { fanOutCron } from "../cron-fan-out.mts"

export default async function handler() {
  await fanOutCron("attribution-reconcile-cron", "/api/attribution/reconcile")
}

export const config = { schedule: "0 * * * *" }
