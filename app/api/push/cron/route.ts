import { db } from "@/lib/db/client"
import { pushSubscriptions } from "@/lib/db/schema"
import { env } from "@/lib/env"
import { detectTransitions } from "@/lib/push/detect"
import { sendOutbidNotifications } from "@/lib/push/send"
import { SALE_ECONOMICS } from "@/lib/sale/economics"
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

  const now = Date.now()
  const opens = new Date(SALE_ECONOMICS.saleOpensIso).getTime()
  const closes = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
  if (now < opens || now > closes) return NextResponse.json({ skipped: "not-live" })

  const { clearingPriceUsd } = await readCommitments()
  if (clearingPriceUsd == null) return NextResponse.json({ skipped: "no-clearing" })

  const subs = await db.select().from(pushSubscriptions)
  if (subs.length === 0) return NextResponse.json({ notified: 0 })

  const { toNotify, statusUpdates } = detectTransitions(subs, clearingPriceUsd)
  const notify = new Set(toNotify)
  const targets = subs.filter((s) => notify.has(s.endpoint))
  const { sent, expiredEndpoints } = await sendOutbidNotifications(targets)

  const expired = new Set(expiredEndpoints)
  // Record status changes (skip endpoints we just pruned), grouped into at most two updates.
  for (const status of ["winning", "outbid"] as const) {
    const endpoints = statusUpdates
      .filter((u) => u.status === status && !expired.has(u.endpoint))
      .map((u) => u.endpoint)
    if (endpoints.length > 0) {
      await db
        .update(pushSubscriptions)
        .set({ lastStatus: status, updatedAt: new Date() })
        .where(inArray(pushSubscriptions.endpoint, endpoints))
    }
  }
  if (expiredEndpoints.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, expiredEndpoints))
  }

  return NextResponse.json({ notified: sent, expired: expiredEndpoints.length })
}
