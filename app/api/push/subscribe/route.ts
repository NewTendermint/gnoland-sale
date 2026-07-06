import { db } from "@/lib/db/client"
import { pushSubscriptionInsertSchema, pushSubscriptions } from "@/lib/db/schema"
import { errorMessage } from "@/lib/log"
import { getSession } from "@/lib/security/session"
import { readCommitments } from "@/lib/sonar/commitments"
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
  // "winning" default would be wrong from the start and fire a bogus outbid push on the next cron
  // tick. Comparison mirrors detect.ts so subscribe-time and cron-time classification agree. If the
  // metrics read fails, fall back to "winning": a false "winning" self-corrects at the next cron
  // tick, whereas rejecting the subscribe loses the user.
  let clearingPriceUsd: number | null = null
  try {
    ;({ clearingPriceUsd } = await readCommitments())
  } catch (err) {
    console.error("push-subscribe: commitments read failed:", errorMessage(err))
  }
  const lastStatus: "winning" | "outbid" =
    clearingPriceUsd == null || row.bidLimitUsd >= clearingPriceUsd ? "winning" : "outbid"
  // Footgun: keys must refresh on upsert - the push service cannot verify e2e-encryption
  // keys, so a row holding stale p256dh/auth would keep "delivering" (no 404/410 to prune on) while
  // the browser silently fails to decrypt - a dead row forever. Refreshing them on every upsert
  // makes that state unrepresentable.
  await db
    .insert(pushSubscriptions)
    .values({ ...row, lastStatus })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: row.p256dh,
        auth: row.auth,
        bidLimitUsd: row.bidLimitUsd,
        lastStatus,
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
