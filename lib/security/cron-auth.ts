import "server-only"
import { NextResponse } from "next/server"
import { env } from "../env"
import { timingSafeEqualStr } from "./secret-compare"

/**
 * Bearer-CRON_SECRET gate for the four scheduled routes. Returns the 401 to hand
 * back, or null when the caller is authorized. Fail-closed: an unset CRON_SECRET
 * authorizes nobody rather than skipping the check. The comparison is
 * constant-time over hashed inputs (./secret-compare).
 *
 * Convention for route preambles: a gate that resolves context returns `{ok}`
 * (lib/sonar/bid-request.ts); a gate that only refuses returns `Response | null`.
 */
export function cronAuthFailure(req: Request): NextResponse | null {
  const expected = env.CRON_SECRET ? `Bearer ${env.CRON_SECRET}` : null
  if (!expected || !timingSafeEqualStr(req.headers.get("authorization"), expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  return null
}
