import "server-only"
import { NextResponse } from "next/server"
import { z } from "zod"
import { env } from "../env"
import { errorMessage } from "../log"
import type { EntitySnapshot } from "../sale/types"
import { getSession } from "../security/session"
import { evmAddress } from "../validation"
import { getEntity } from "./entity"
import { SonarAuthError } from "./permit"

// Only the wallet comes from the client; the entity is derived server-side (IDOR defense).
const bidBodySchema = z.object({ wallet: evmAddress })

export type BidContext = { sessionId: string; wallet: string; entity: EntitySnapshot }
type BidGate = { ok: true; ctx: BidContext } | { ok: false; res: NextResponse }

/** Shared security preamble for the two mutating bid routes (kill-switch, auth, parse, entity). */
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
    if (err instanceof SonarAuthError) {
      return { ok: false, res: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) }
    }
    console.error("sonar-bid-request:", errorMessage(err))
    return { ok: false, res: NextResponse.json({ error: "entity_unavailable" }, { status: 502 }) }
  }
}
