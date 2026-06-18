import { resolveBidRequest } from "@/lib/sonar/bid-request"
import { SonarAuthError, prePurchaseCheck } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/sonar/pre-purchase
// Authenticated proxy. Kill-switch, auth gate, wallet parse, server-derived entity (IDOR defense) in resolveBidRequest.
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
