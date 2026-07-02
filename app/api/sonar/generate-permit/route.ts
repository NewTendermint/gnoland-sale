import { ipHmac, parseForwardedFor } from "@/lib/security/ip"
import { classifyUserAgent } from "@/lib/security/user-agent"
import { resolveBidRequest } from "@/lib/sonar/bid-request"
import { PermitDedupError, SonarAuthError, generatePurchasePermit } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/sonar/generate-permit
// Authenticated proxy. Kill-switch, auth gate, wallet parse, server-derived entity (IDOR defense) in resolveBidRequest.
export async function POST(request: Request) {
  const gate = await resolveBidRequest(request)
  if (!gate.ok) return gate.res
  const { sessionId, wallet, entity } = gate.ctx
  // Prefer Netlify's connection IP (unspoofable) over x-forwarded-for.
  const ip =
    request.headers.get("x-nf-client-connection-ip") ??
    parseForwardedFor(request.headers.get("x-forwarded-for"))
  try {
    const result = await generatePurchasePermit({
      sessionId,
      entityId: entity.entityId,
      wallet,
      ipHmac: ip ? ipHmac(ip) : null,
      userAgentClass: classifyUserAgent(request.headers.get("user-agent")),
    })
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } })
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
