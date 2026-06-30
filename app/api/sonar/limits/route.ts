import { resolveBidRequest } from "@/lib/sonar/bid-request"
import { readLimits } from "@/lib/sonar/limits"
import { SonarAuthError } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/sonar/limits
// Authenticated proxy for the wallet's commitment limits. Kill-switch, auth gate, wallet parse,
// server-derived entity (IDOR defense) all in resolveBidRequest. Client falls back to the published
// economics default when this returns null/non-200, so a failure never blocks the bid form.
export async function POST(request: Request) {
  const gate = await resolveBidRequest(request)
  if (!gate.ok) return gate.res
  const { sessionId, wallet } = gate.ctx
  try {
    const result = await readLimits(sessionId, wallet)
    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof SonarAuthError) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    }
    // No Sentry in the stack (ADR D): log so the failure is visible in the dev terminal / Netlify
    // function logs. The message is a Sonar APIError (status + code), no PII.
    console.error(
      "[/api/sonar/limits] readLimits failed:",
      err instanceof Error ? `${err.name}: ${err.message}` : err,
    )
    return NextResponse.json({ error: "limits_failed" }, { status: 502 })
  }
}
