import { ipHmac, parseForwardedFor } from "@/lib/security/ip"
import { classifyUserAgent } from "@/lib/security/user-agent"
import { resolveBidRequest } from "@/lib/sonar/bid-request"
import { PermitDedupError, SonarAuthError, generatePurchasePermit } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"

// Node runtime: libsodium (WASM), node:crypto and the Neon driver are pulled in
// transitively and do not run on the Edge runtime.
export const runtime = "nodejs"

// POST /api/sonar/generate-permit
// Authenticated proxy: issues a Sonar purchase permit for the session's entity +
// wallet and writes an audit row (IP hashed, UA bucketed). No amount: the bid amount
// is signed on chain, not at permit time. The kill-switch, auth gate, wallet body
// parse, and server-derived entity (the IDOR defense) live in resolveBidRequest.
export async function POST(request: Request) {
  const gate = await resolveBidRequest(request)
  if (!gate.ok) return gate.res
  const { sessionId, wallet, entity } = gate.ctx
  // Prefer Netlify's connection IP (set from the TCP peer, unspoofable) over the
  // client-controllable left-most x-forwarded-for hop; fall back for local/non-Netlify.
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
