import { db } from "@/lib/db/client"
import { CRON_LEASE_TTL_S, acquireCronLease, releaseCronLease } from "@/lib/db/lease"
import { priceEmailState } from "@/lib/db/schema"
import { decidePriceEmail } from "@/lib/email/decide"
import { env } from "@/lib/env"
import { sendPriceCampaign } from "@/lib/newsletter/campaign"
import { saleIsLive } from "@/lib/sale/live-window"
import { resolveSalePhase } from "@/lib/sale/phase"
import { timingSafeEqualStr } from "@/lib/security/secret-compare"
import { readCommitments } from "@/lib/sonar/commitments"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/email/cron - hourly scheduled function target; bearer CRON_SECRET required.
// Emails the Mailchimp list when the clearing price rose since the last email (24h cooldown).
// EMAIL_ALERTS_ENABLED !== "1" -> dry-run: identical decision + logs, no Mailchimp call, and NO
// state advance (only the first-run baseline is recorded), so enabling the flag later sends on
// the next genuine rise instead of inheriting a cooldown from a dry run nobody received.
export async function POST(req: Request) {
  const expected = env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : null
  if (!expected || !timingSafeEqualStr(req.headers.get("authorization"), expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const now = Date.now()
  // Outbound marketing stays inside the ANNOUNCED window AND a live contract - unlike the push
  // cron, a campaign sent before the public open (early Commitment stage) would be wrong.
  if (resolveSalePhase(now) !== "live" || !(await saleIsLive(now))) {
    return NextResponse.json({ skipped: "not-live" })
  }

  if (!(await acquireCronLease("email-cron", CRON_LEASE_TTL_S))) {
    return NextResponse.json({ skipped: "locked" })
  }
  try {
    const { clearingPriceUsd } = await readCommitments()
    if (clearingPriceUsd == null) return NextResponse.json({ skipped: "no-clearing" })

    const rows = await db.select().from(priceEmailState)
    const state = rows[0] ?? null
    const decision = decidePriceEmail({
      clearingPriceUsd,
      lastSentPriceUsd: state?.lastSentPriceUsd ?? null,
      lastSentAtMs: state?.lastSentAt ? state.lastSentAt.getTime() : null,
      nowMs: now,
    })
    const dryRun = env.EMAIL_ALERTS_ENABLED !== "1"
    const label = decision.action === "send" ? "send" : `skip:${decision.reason}`
    console.info(
      `email-cron: decision=${label} dryRun=${dryRun} clearing=${clearingPriceUsd} lastSent=${state?.lastSentPriceUsd ?? "none"} lastSentAt=${state?.lastSentAt?.toISOString() ?? "never"}`,
    )

    const recordState = (lastSentAt: Date | null) =>
      db
        .insert(priceEmailState)
        .values({ id: 1, lastSentPriceUsd: clearingPriceUsd, lastSentAt })
        .onConflictDoUpdate({
          target: priceEmailState.id,
          set: { lastSentPriceUsd: clearingPriceUsd, ...(lastSentAt ? { lastSentAt } : {}) },
        })

    let sent = false
    if (decision.action === "skip" && decision.reason === "first-run-baseline") {
      await recordState(null)
    } else if (decision.action === "send" && !dryRun) {
      // Footgun: send THEN record, unlike the push cron - recording first would turn a failed
      // Mailchimp send into a silently lost campaign until the next price rise. The crash window
      // after a successful send is a rare single duplicate, bounded by the lease + 24h cooldown.
      const res = await sendPriceCampaign(clearingPriceUsd)
      if (res.outcome === "ok") {
        sent = true
        await recordState(new Date(now))
      } else {
        // State NOT advanced: the next hourly run retries. The log carries the failing step.
        console.error(`email-cron: mailchimp ${res.step} -> HTTP ${res.status}`)
      }
    }

    // A send was attempted but did not land exactly when: send decided, not a dry run, not sent.
    // 502 lets the fan-out's ok-check tell a failed send apart from a healthy skip.
    const sendFailed = decision.action === "send" && !dryRun && !sent
    return NextResponse.json(
      {
        decision: label,
        dryRun,
        sent,
        clearingPriceUsd,
        lastSentPriceUsd: state?.lastSentPriceUsd ?? null,
        lastSentAt: state?.lastSentAt?.toISOString() ?? null,
      },
      sendFailed ? { status: 502 } : undefined,
    )
  } finally {
    await releaseCronLease("email-cron")
  }
}
