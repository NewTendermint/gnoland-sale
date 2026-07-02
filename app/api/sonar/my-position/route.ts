import { getSession } from "@/lib/security/session"
import { readMyBid } from "@/lib/sonar/commitments"
import { SonarAuthError } from "@/lib/sonar/permit"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// GET /api/sonar/my-position
// Authenticated; the session entity's current commitment, or null. Derived server-side.
export async function GET() {
  const session = await getSession()
  if (!session.sessionId) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
  }
  // Rolling: re-stamp the 2h cookie window.
  await session.save()
  try {
    return NextResponse.json(await readMyBid(session.sessionId), {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (err) {
    if (err instanceof SonarAuthError) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
    }
    return NextResponse.json({ error: "my_position_unavailable" }, { status: 502 })
  }
}
