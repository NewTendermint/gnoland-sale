import { resolveBidRequest } from "@/lib/sonar/bid-request"
import { SonarAuthError, prePurchaseCheck } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"

// Node runtime: this path pulls in libsodium (WASM), node:crypto and the Neon
// driver transitively, none of which run on the Edge runtime.
export const runtime = "nodejs"

// POST /api/sonar/pre-purchase
// Authenticated proxy: checks whether the session's entity may purchase for the
// given wallet (KYC, region, liveness, wallet risk). The kill-switch, auth gate,
// wallet body parse, and server-derived entity (the IDOR defense) all live in
// resolveBidRequest, shared with generate-permit so the boundary can't drift.
export async function POST(request: Request) {
  const gate = await resolveBidRequest(request)
  if (!gate.ok) return gate.res
  const { sessionId, wallet, entity } = gate.ctx
  try {
    const result = await prePurchaseCheck({ sessionId, entityId: entity.entityId, wallet })
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof SonarAuthError) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    }
    return NextResponse.json({ error: "pre_purchase_failed" }, { status: 502 })
  }
}
