import { env } from "@/lib/env"
import { getSession } from "@/lib/security/session"
import { createSonarClient } from "@/lib/sonar/client"
import { consumePkceState } from "@/lib/sonar/oauth"
import { storeTokens } from "@/lib/sonar/tokens"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

// GET /api/auth/sonar/callback?code=...&state=...
export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  // Redirect off the canonical site URL, never request.url: on a Netlify branch deploy
  // request.url is the immutable deploy permalink, not the stable alias / prod domain.
  let home: URL
  try {
    home = new URL("/", process.env.NEXT_PUBLIC_SITE_URL || request.url)
  } catch {
    home = new URL("/", request.url)
  }

  if (!code || !state) {
    home.searchParams.set("auth", "error")
    return NextResponse.redirect(home)
  }

  try {
    const session = await getSession()
    const pkce = await consumePkceState(state)
    // Bind OAuth state to the initiating session (CSRF defense).
    if (!session.sessionId || session.sessionId !== pkce.sessionId) {
      throw new Error("Session/state mismatch")
    }
    const tokens = await createSonarClient().exchangeAuthorizationCode({
      code,
      codeVerifier: pkce.codeVerifier,
      redirectURI: env.SONAR_REDIRECT_URI,
    })
    await storeTokens(session.sessionId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    })
    home.searchParams.set("auth", "ok")
    return NextResponse.redirect(home)
  } catch {
    // Never leak the failure reason to the URL.
    home.searchParams.set("auth", "error")
    return NextResponse.redirect(home)
  }
}
