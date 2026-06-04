import "server-only"
import { NextResponse } from "next/server"
import { z } from "zod"
import { env } from "../env"
import type { EntitySnapshot } from "../sale/types"
import { getSession } from "../security/session"
import { evmAddress } from "../validation"
import { getEntity } from "./entity"
import { SonarAuthError } from "./permit"

// Only the bidding wallet comes from the client. The entity is derived from the
// session server-side - never trust a client-supplied entityId, which would let a
// caller act against another user's KYC entity (IDOR).
const bidBodySchema = z.object({ wallet: evmAddress })

export type BidContext = { sessionId: string; wallet: string; entity: EntitySnapshot }
type BidGate = { ok: true; ctx: BidContext } | { ok: false; res: NextResponse }

/**
 * Shared preamble for the two mutating bid routes (pre-purchase + generate-permit):
 * the emergency kill-switch, the auth gate (and rolling the session forward), the
 * wallet-only body parse, and the server-derived entity (the IDOR defense). Kept in
 * one place so this security boundary cannot drift between the routes. Returns the
 * resolved context, or a ready-to-return error Response the caller forwards as-is.
 */
export async function resolveBidRequest(request: Request): Promise<BidGate> {
  if (env.SALE_PAUSED === "true") {
    return { ok: false, res: NextResponse.json({ error: "sale_paused" }, { status: 503 }) }
  }
  const session = await getSession()
  if (!session.sessionId) {
    return { ok: false, res: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) }
  }
  // Rolling: re-stamp the 2h cookie window on each authenticated action.
  await session.save()
  const parsed = bidBodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return { ok: false, res: NextResponse.json({ error: "invalid_request" }, { status: 400 }) }
  }
  try {
    const entity = await getEntity(session.sessionId)
    if (!entity) {
      return { ok: false, res: NextResponse.json({ error: "no_entity" }, { status: 409 }) }
    }
    return { ok: true, ctx: { sessionId: session.sessionId, wallet: parsed.data.wallet, entity } }
  } catch (err) {
    // A revoked/expired Sonar token (401) means reconnect, not a generic failure.
    if (err instanceof SonarAuthError) {
      return { ok: false, res: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) }
    }
    return { ok: false, res: NextResponse.json({ error: "entity_unavailable" }, { status: 502 }) }
  }
}
