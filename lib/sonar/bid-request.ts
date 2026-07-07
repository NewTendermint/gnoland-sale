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

// Route handlers get no bodySizeLimit (next.config covers server actions only); cap before parsing.
const MAX_BODY_BYTES = 1024

function jsonOrNull(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

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
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return { ok: false, res: NextResponse.json({ error: "invalid_request" }, { status: 413 }) }
  }
  const raw = await request.text().catch(() => "")
  const parsed = bidBodySchema.safeParse(
    Buffer.byteLength(raw) <= MAX_BODY_BYTES ? jsonOrNull(raw) : null,
  )
  if (!parsed.success) {
    return { ok: false, res: NextResponse.json({ error: "invalid_request" }, { status: 400 }) }
  }
  try {
    const entity = await getEntity(session.sessionId)
    if (!entity) {
      // Same status + marker as GET /api/sonar/entity's no_entity, for cross-route consistency;
      // the bid-route client treats any non-2xx generically (only 401/403 are special-cased).
      return { ok: false, res: NextResponse.json({ error: "no_entity" }, { status: 404 }) }
    }
    // Fail closed on the entity's own state: whether Sonar refuses ineligible entities server-side
    // is unverified, and the "unknown" normalization sentinels must never reach permit issuance.
    if (entity.eligibility !== "eligible" || entity.setupState !== "complete") {
      return {
        ok: false,
        res: NextResponse.json({ error: "entity_not_eligible" }, { status: 403 }),
      }
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
