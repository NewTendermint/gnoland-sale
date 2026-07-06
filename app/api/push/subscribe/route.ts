import { db } from "@/lib/db/client"
import { pushSubscriptionInsertSchema, pushSubscriptions } from "@/lib/db/schema"
import { errorMessage } from "@/lib/log"
import { classifyBid } from "@/lib/push/detect"
import { getSession } from "@/lib/security/session"
import { readCommitmentsCached } from "@/lib/sonar/commitments"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/push/subscribe - upsert this browser's push subscription.
// A session is required (anti-spam auth gate) but NOT stored: the row holds nothing traceable to a
// user or wallet. The body is validated strict, so no extra field can be smuggled in.
export async function POST(req: Request) {
  const session = await getSession()
  if (!session.sessionId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = pushSubscriptionInsertSchema.safeParse({
    endpoint: body?.subscription?.endpoint,
    p256dh: body?.subscription?.keys?.p256dh,
    auth: body?.subscription?.keys?.auth,
    bidLimitUsd: body?.bidLimitUsd,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 })
  }
  const row = parsed.data
  // The UI allows opting in with a bidLimitUsd already below the clearing price, so the schema's
  // "winning" default would seed a bogus outbid push on the next cron tick. The read is cached
  // (~10s): PushLimitSync re-POSTs this route on every page load of a subscribed bidder. A failed
  // read falls back to "winning" - a wrong seed self-corrects at the next cron tick, whereas
  // rejecting the subscribe loses the user.
  const metrics = await readCommitmentsCached().catch((err) => {
    console.error("push-subscribe: commitments read failed:", errorMessage(err))
    return null
  })
  const clearingPriceUsd = metrics?.clearingPriceUsd ?? null
  const lastStatus =
    clearingPriceUsd == null ? "winning" : classifyBid(row.bidLimitUsd, clearingPriceUsd)
  // Footgun: keys must refresh on upsert - the push service cannot verify e2e-encryption
  // keys, so a row holding stale p256dh/auth would keep "delivering" (no 404/410 to prune on) while
  // the browser silently fails to decrypt - a dead row forever. Refreshing them on every upsert
  // makes that state unrepresentable.
  // lastStatus is seeded on INSERT only, never in the conflict set: after insert, the cron is the
  // sole writer (its persist-before-send ordering is the once-per-transition guarantee). Writing it
  // here on every re-POST could swallow a pending alert, resend a delivered one after a failed
  // metrics read, or clobber a fresher cron-written status.
  await db
    .insert(pushSubscriptions)
    .values({ ...row, lastStatus })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: row.p256dh,
        auth: row.auth,
        bidLimitUsd: row.bidLimitUsd,
        updatedAt: new Date(),
      },
    })
  return NextResponse.json({ ok: true })
}

// DELETE /api/push/subscribe - remove a subscription by its endpoint on unsubscribe.
export async function DELETE(req: Request) {
  const session = await getSession()
  if (!session.sessionId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const endpoint = body?.endpoint
  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 })
  }
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
  return NextResponse.json({ ok: true })
}
