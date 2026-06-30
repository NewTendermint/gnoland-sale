import { randomUUID } from "node:crypto"
import { getSession } from "@/lib/security/session"
import { sonarMockEnabled } from "@/lib/sonar/mock-config"
import { generatePkceAndStore } from "@/lib/sonar/oauth"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// POST /api/auth/sonar/init
export async function POST() {
  const session = await getSession()
  if (!session.sessionId) {
    session.sessionId = randomUUID()
    await session.save()
  }
  if (sonarMockEnabled()) {
    // TODO: remove the mock login bypass when SONAR_MOCK is dropped
    return NextResponse.json({ authorizationUrl: "/?auth=ok" })
  }
  const authorizationUrl = await generatePkceAndStore(session.sessionId)
  return NextResponse.json({ authorizationUrl })
}
