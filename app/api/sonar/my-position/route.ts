import { getSession } from "@/lib/security/session"
import { readMyBid } from "@/lib/sonar/commitments"
import { SonarAuthError } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"

// Node runtime: pulls in libsodium (WASM), node:crypto and the Neon driver
// transitively, none of which run on the Edge runtime.
export const runtime = "nodejs"

// GET /api/sonar/my-position
// Authenticated: the session entity's current commitment (price + committed), or
// null when it has none. Derived server-side from the entity's per-sale id.
export async function GET() {
  const session = await getSession()
  if (!session.sessionId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  try {
    return NextResponse.json(await readMyBid(session.sessionId))
  } catch (err) {
    if (err instanceof SonarAuthError) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    }
    return NextResponse.json({ error: "my_position_unavailable" }, { status: 502 })
  }
}
