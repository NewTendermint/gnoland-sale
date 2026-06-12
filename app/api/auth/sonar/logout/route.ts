import { getSession } from "@/lib/security/session"
import { deleteTokens } from "@/lib/sonar/tokens"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/auth/sonar/logout
// Ends the Sonar link for this browser: destroys the iron-session cookie and
// deletes the server-held encrypted tokens. POST + SameSite=Lax keeps cross-site
// triggering out; idempotent 204 either way; no body, no PII in the response.
export async function POST() {
  const session = await getSession()
  const sessionId = session.sessionId
  session.destroy()
  if (sessionId) {
    try {
      await deleteTokens(sessionId)
    } catch {
      // Cookie is already gone, so the link is dead either way; the orphaned
      // token row is unreachable without the session id and ages out.
    }
  }
  return new NextResponse(null, { status: 204 })
}
