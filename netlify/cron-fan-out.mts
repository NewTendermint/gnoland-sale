// Shared dispatch for the scheduled cron functions (netlify/functions/*.mts): POST the
// bearer-authed app route to the production deploy and, when configured, the staging
// branch-deploy (Netlify only schedules the PUBLISHED production deploy, so the one prod
// run has to poke staging's own routes too).
//
// The PROD leg decides the run status: a failed prod call throws, so Netlify marks the
// invocation failed. The staging leg only logs - a gated, sleeping, or stale-URL branch
// deploy must not paint the prod schedule red, or a real prod failure drowns in that noise.
//
// Lives OUTSIDE netlify/functions/ so Netlify never registers it as a function entry.

/** POST the route on one deploy; null on 2xx, else a "base -> status" failure description. */
async function post(base: string, route: string, secret: string): Promise<string | null> {
  const res = await fetch(`${base}${route}`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  }).catch(() => null)
  if (res?.ok) return null
  return `${base} -> ${res?.status ?? "unreachable"}`
}

export async function fanOutCron(label: string, route: string): Promise<void> {
  const secret = process.env.CRON_SECRET
  // Quiet by design, unlike the no-prod-target throw below: an absent CRON_SECRET is the
  // documented off-switch for the whole cron feature (lib/env.ts), not a resolution bug.
  if (!secret) return
  // `||` not `??`: a var blanked to "" (instead of deleted, e.g. at the DNS cutover) must
  // fall through to the next candidate, not silently drop the target and leave runs green.
  // CRON_PROD_URL overrides while sale.gno.land DNS is not on Netlify (URL = that domain).
  const prod = process.env.CRON_PROD_URL || process.env.URL || process.env.NEXT_PUBLIC_SITE_URL
  const staging = process.env.CRON_STAGING_URL || undefined
  if (!prod) {
    // Unreachable on Netlify (URL is platform-injected) but a resolution bug must fail
    // the run, never report a green no-op.
    throw new Error(`${label}: no production target resolved`)
  }
  const [prodFailure, stagingFailure] = await Promise.all([
    post(prod, route, secret),
    staging && staging !== prod ? post(staging, route, secret) : null,
  ])
  // Log staging so a wrong secret / access-gated leg stays visible in the function logs.
  if (stagingFailure !== null) console.error(`${label}: staging ${stagingFailure}`)
  if (prodFailure !== null) {
    const message = `${label}: ${prodFailure}`
    console.error(message)
    throw new Error(message)
  }
}
