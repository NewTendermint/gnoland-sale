import { db } from "@/lib/db/client"
import { priceEmailState } from "@/lib/db/schema"
import { decidePriceEmail } from "@/lib/email/decide"
import { env } from "@/lib/env"
import { sendPriceCampaign } from "@/lib/newsletter/campaign"
import { SALE_ECONOMICS } from "@/lib/sale/economics"
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
  const opens = new Date(SALE_ECONOMICS.saleOpensIso).getTime()
  const closes = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
  if (now < opens || now > closes) return NextResponse.json({ skipped: "not-live" })

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
    const res = await sendPriceCampaign(clearingPriceUsd)
    if (res.outcome === "ok") {
      sent = true
      await recordState(new Date(now))
    } else {
      // State NOT advanced: the next hourly run retries. The log carries the failing step.
      console.error(`email-cron: mailchimp ${res.step} -> HTTP ${res.status}`)
    }
  }

  return NextResponse.json({
    decision: label,
    dryRun,
    sent,
    clearingPriceUsd,
    lastSentPriceUsd: state?.lastSentPriceUsd ?? null,
    lastSentAt: state?.lastSentAt?.toISOString() ?? null,
  })
}
