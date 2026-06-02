import { env } from "@/lib/env"
import { getSession } from "@/lib/security/session"
import { getEntity } from "@/lib/sonar/entity"
import { SonarAuthError, prePurchaseCheck } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"
import { z } from "zod"

// Node runtime: this path pulls in libsodium (WASM), node:crypto and the Neon
// driver transitively, none of which run on the Edge runtime.
export const runtime = "nodejs"

// Only the bidding wallet comes from the client. The entity is derived from the
// session server-side (getEntity) - never trust a client-supplied entityId,
// which would let a caller probe another user's KYC entity (IDOR).
const bodySchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

// POST /api/sonar/pre-purchase
// Authenticated proxy: checks whether the session's entity may purchase for the
// given wallet (KYC, region, liveness, wallet risk).
export async function POST(request: Request) {
  if (env.SALE_PAUSED === "true") {
    return NextResponse.json({ error: "sale_paused" }, { status: 503 })
  }
  const session = await getSession()
  if (!session.sessionId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }
  try {
    const entity = await getEntity(session.sessionId)
    if (!entity) {
      return NextResponse.json({ error: "no_entity" }, { status: 409 })
    }
    const result = await prePurchaseCheck({
      sessionId: session.sessionId,
      entityId: entity.entityId,
      wallet: parsed.data.wallet,
    })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof SonarAuthError) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    }
    return NextResponse.json({ error: "pre_purchase_failed" }, { status: 502 })
  }
}
