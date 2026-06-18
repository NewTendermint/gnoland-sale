import { getSession } from "@/lib/security/session"
import { deleteTokens } from "@/lib/sonar/tokens"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/auth/sonar/logout
// Destroys the session cookie and deletes the server-held encrypted tokens.
export async function POST() {
  const session = await getSession()
  const sessionId = session.sessionId
  session.destroy()
  if (sessionId) {
    try {
      await deleteTokens(sessionId)
    } catch {
      // Cookie is already gone; orphaned token row ages out.
    }
  }
  return new NextResponse(null, { status: 204 })
}
