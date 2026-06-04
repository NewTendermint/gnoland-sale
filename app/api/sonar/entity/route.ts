import { getSession } from "@/lib/security/session"
import { getEntity } from "@/lib/sonar/entity"
import { SonarAuthError } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// GET /api/sonar/entity
// Authenticated: returns the session's entity (id + KYC setup state +
// eligibility), the data the client journey is derived from. entityId is taken
// from the session's token server-side, never from the client.
export async function GET() {
  const session = await getSession()
  if (!session.sessionId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  // Rolling: re-stamp the 2h cookie window on each authenticated read.
  await session.save()
  try {
    const entity = await getEntity(session.sessionId)
    if (!entity) {
      return NextResponse.json({ error: "no_entity" }, { status: 404 })
    }
    return NextResponse.json(entity)
  } catch (err) {
    // A revoked/expired Sonar token (401) means the client must reconnect, not
    // that the entity is unavailable; mirror the permit routes and emit 401.
    if (err instanceof SonarAuthError) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    }
    return NextResponse.json({ error: "entity_unavailable" }, { status: 502 })
  }
}
