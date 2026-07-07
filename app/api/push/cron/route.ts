import { db } from "@/lib/db/client"
import { CRON_LEASE_TTL_S, acquireCronLease, releaseCronLease } from "@/lib/db/lease"
import { pushSubscriptions } from "@/lib/db/schema"
import { env } from "@/lib/env"
import { detectTransitions } from "@/lib/push/detect"
import { OUTBID_TTL_CAP_S, sendOutbidNotifications } from "@/lib/push/send"
import { pushTtlSeconds, saleIsLive } from "@/lib/sale/live-window"
import { timingSafeEqualStr } from "@/lib/security/secret-compare"
import { readCommitments } from "@/lib/sonar/commitments"
import { inArray } from "drizzle-orm"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/push/cron - Netlify scheduled function; bearer CRON_SECRET required.
export async function POST(req: Request) {
  const expected = env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : null
  if (!expected || !timingSafeEqualStr(req.headers.get("authorization"), expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!(await saleIsLive(Date.now()))) return NextResponse.json({ skipped: "not-live" })

  // Overlap guard: schedule + manual invocation (or a slow run outliving the next tick) must not
  // double-send; released in the finally, TTL covers a process death.
  if (!(await acquireCronLease("push-cron", CRON_LEASE_TTL_S))) {
    return NextResponse.json({ skipped: "locked" })
  }
  try {
    const { clearingPriceUsd } = await readCommitments()
    if (clearingPriceUsd == null) return NextResponse.json({ skipped: "no-clearing" })

    const subs = await db.select().from(pushSubscriptions)
    if (subs.length === 0) return NextResponse.json({ notified: 0 })

    const { toNotify, statusUpdates } = detectTransitions(subs, clearingPriceUsd)

    // Footgun: persist BEFORE sending - send-first re-detects the same transition after a crash
    // and spams "You've been outbid" every tick until an update lands. Grouped into two updates.
    for (const status of ["winning", "outbid"] as const) {
      const endpoints = statusUpdates.filter((u) => u.status === status).map((u) => u.endpoint)
      if (endpoints.length > 0) {
        await db
          .update(pushSubscriptions)
          .set({ lastStatus: status, updatedAt: new Date() })
          .where(inArray(pushSubscriptions.endpoint, endpoints))
      }
    }

    const notify = new Set(toNotify)
    const targets = subs.filter((s) => notify.has(s.endpoint))
    // The cron owns the TTL policy: it already resolves the sale window chain-first (saleIsLive
    // gate above), so it also decides how long an alert stays deliverable.
    const ttlSeconds = pushTtlSeconds(Date.now(), OUTBID_TTL_CAP_S)
    const { sent, expiredEndpoints } = await sendOutbidNotifications(targets, ttlSeconds)

    if (expiredEndpoints.length > 0) {
      await db
        .delete(pushSubscriptions)
        .where(inArray(pushSubscriptions.endpoint, expiredEndpoints))
    }

    return NextResponse.json({ notified: sent, expired: expiredEndpoints.length })
  } finally {
    await releaseCronLease("push-cron")
  }
}
