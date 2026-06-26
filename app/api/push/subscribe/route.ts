import { db } from "@/lib/db/client"
import { pushSubscriptionInsertSchema, pushSubscriptions } from "@/lib/db/schema"
import { getSession } from "@/lib/security/session"
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
  await db
    .insert(pushSubscriptions)
    .values(row)
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { bidLimitUsd: row.bidLimitUsd, updatedAt: new Date() },
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
