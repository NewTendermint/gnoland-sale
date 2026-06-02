import { env } from "@/lib/env"
import { ipHmac, parseForwardedFor } from "@/lib/security/ip"
import { getSession } from "@/lib/security/session"
import { classifyUserAgent } from "@/lib/security/user-agent"
import { getEntity } from "@/lib/sonar/entity"
import { PermitDedupError, SonarAuthError, generatePurchasePermit } from "@/lib/sonar/permit"
import { evmAddress } from "@/lib/validation"
import { NextResponse } from "next/server"
import { z } from "zod"

// Node runtime: libsodium (WASM), node:crypto and the Neon driver are pulled in
// transitively and do not run on the Edge runtime.
export const runtime = "nodejs"

// Only the bidding wallet comes from the client. The entity is derived from the
// session server-side (getEntity) - never trust a client-supplied entityId,
// which would let a caller issue a permit against another user's KYC entity.
const bodySchema = z.object({
  wallet: evmAddress,
})

// POST /api/sonar/generate-permit
// Authenticated proxy: issues a Sonar purchase permit for the session's entity
// + wallet and writes an audit row (IP hashed, UA bucketed). No amount: the bid
// amount is signed on chain, not at permit time.
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
  const ip = parseForwardedFor(request.headers.get("x-forwarded-for"))
  try {
    const entity = await getEntity(session.sessionId)
    if (!entity) {
      return NextResponse.json({ error: "no_entity" }, { status: 409 })
    }
    const result = await generatePurchasePermit({
      sessionId: session.sessionId,
      entityId: entity.entityId,
      wallet: parsed.data.wallet,
      ipHmac: ip ? ipHmac(ip) : null,
      userAgentClass: classifyUserAgent(request.headers.get("user-agent")),
    })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof SonarAuthError) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    }
    if (err instanceof PermitDedupError) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 })
    }
    return NextResponse.json({ error: "permit_failed" }, { status: 502 })
  }
}
