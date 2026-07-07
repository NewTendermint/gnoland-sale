import "server-only"
import { type IronSession, type SessionOptions, getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { env } from "../env"

// Cookie holds only an opaque session id (FK into oauth_tokens); no tokens, no PII.
export interface AppSession {
  sessionId?: string
}

// 2 hours, rolling: re-stamped on every save(). ttl governs the SEAL (server-side validity);
// iron-session does NOT derive it from cookie maxAge - unset it silently defaults to 14 days,
// leaving a stolen cookie replayable long after the browser dropped it. maxAge is left to the
// library (ttl minus its 60s clock-skew allowance) so seal and cookie can never drift apart.
const SESSION_TTL_S = 60 * 60 * 2

export async function getSession(): Promise<IronSession<AppSession>> {
  const cookieStore = await cookies()
  // One flag for both: __Host- REQUIRES Secure (a prefixed insecure cookie is silently rejected
  // by browsers), so the name and the secure attribute must never be keyed on different checks.
  const secure = process.env.NODE_ENV === "production"
  const sessionOptions: SessionOptions = {
    password: env.SESSION_PASSWORD,
    // __Host- locks the cookie to this exact host, Secure, Path=/, no Domain (no subdomain
    // shadowing). Prod-only: the prefix requires Secure, which dev http would fail.
    cookieName: secure ? "__Host-gnot_session" : "gnot_session",
    ttl: SESSION_TTL_S,
    cookieOptions: {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
    },
  }
  return getIronSession<AppSession>(cookieStore, sessionOptions)
}
