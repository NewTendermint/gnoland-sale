import "server-only"
import { type IronSession, type SessionOptions, getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { env } from "../env"

// Cookie holds only an opaque session id (FK into oauth_tokens); no tokens, no PII.
export interface AppSession {
  sessionId?: string
}

export async function getSession(): Promise<IronSession<AppSession>> {
  const cookieStore = await cookies()
  const sessionOptions: SessionOptions = {
    password: env.SESSION_PASSWORD,
    cookieName: "gnot_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // 2 hours, rolling: re-stamped on every save().
      maxAge: 60 * 60 * 2,
    },
  }
  return getIronSession<AppSession>(cookieStore, sessionOptions)
}
