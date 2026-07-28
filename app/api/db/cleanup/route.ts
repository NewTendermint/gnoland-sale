import { db } from "@/lib/db/client"
import { oauthTokens, pkceStates } from "@/lib/db/schema"
import { cronAuthFailure } from "@/lib/security/cron-auth"
import { lt } from "drizzle-orm"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// Grace window past the Sonar-token expiry before an oauth_tokens row is swept (ADR: Retention &
// cleanup). Sonar's real expires_in is far longer than the token's own life, so a row only becomes
// eligible ~this many days after it stops being usable - recalibrate if prod expires_in changes.
const OAUTH_GRACE_DAYS = 7

// POST /api/db/cleanup - Netlify scheduled function (daily); bearer CRON_SECRET required.
// Sweeps DEAD rows only: expired single-use PKCE states, and oauth_tokens expired past the grace
// window. Never touches a live session or an in-flight OAuth flow. Not a table wipe.
export async function POST(req: Request) {
  const unauthorized = cronAuthFailure(req)
  if (unauthorized) return unauthorized

  const now = Date.now()
  const oauthCutoff = new Date(now - OAUTH_GRACE_DAYS * 24 * 60 * 60 * 1000)

  const prunedPkce = await db
    .delete(pkceStates)
    .where(lt(pkceStates.expiresAt, new Date(now)))
    .returning({ state: pkceStates.state })

  const prunedTokens = await db
    .delete(oauthTokens)
    .where(lt(oauthTokens.expiresAt, oauthCutoff))
    .returning({ sessionId: oauthTokens.sessionId })

  return NextResponse.json({ pkce: prunedPkce.length, oauthTokens: prunedTokens.length })
}
