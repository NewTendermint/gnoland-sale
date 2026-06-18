import { getSession } from "@/lib/security/session"
import { getEntity } from "@/lib/sonar/entity"
import { SonarAuthError } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// GET /api/sonar/entity
// Authenticated; entityId is taken from the session server-side, never from the client.
export async function GET() {
  const session = await getSession()
  if (!session.sessionId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  // Rolling: re-stamp the 2h cookie window.
  await session.save()
  try {
    const entity = await getEntity(session.sessionId)
    if (!entity) {
      return NextResponse.json({ error: "no_entity" }, { status: 404 })
    }
    return NextResponse.json(entity)
  } catch (err) {
    // Revoked/expired Sonar token -> 401 so the client reconnects.
    if (err instanceof SonarAuthError) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    }
    return NextResponse.json({ error: "entity_unavailable" }, { status: 502 })
  }
}
