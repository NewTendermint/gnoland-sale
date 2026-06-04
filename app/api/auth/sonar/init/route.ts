import { randomUUID } from "node:crypto"
import { getSession } from "@/lib/security/session"
import { sonarMockEnabled } from "@/lib/sonar/mock-config"
import { generatePkceAndStore } from "@/lib/sonar/oauth"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/auth/sonar/init
// Ensures the caller has a session id, mints PKCE params (stored server-side),
// and returns the Sonar authorization URL for the browser to redirect to.
export async function POST() {
  const session = await getSession()
  if (!session.sessionId) {
    session.sessionId = randomUUID()
    await session.save()
  }
  if (sonarMockEnabled()) {
    // TODO(real-data): mock login bypass - with SONAR_MOCK off this branch is skipped
    // and the real PKCE OAuth URL (below) is returned instead.
    // Mock: there is no Sonar auth page to redirect to. The session is now
    // "logged in" (entity/permit routes serve fixtures), so bounce straight home.
    return NextResponse.json({ authorizationUrl: "/?auth=ok" })
  }
  const authorizationUrl = await generatePkceAndStore(session.sessionId)
  return NextResponse.json({ authorizationUrl })
}
