import "server-only"
import { type IronSession, type SessionOptions, getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { env } from "../env"

/**
 * Session payload. Deliberately minimal: just an opaque session id (the foreign
 * key into oauth_tokens). No OAuth tokens and no PII live in the cookie itself;
 * the cookie only references server-held, encrypted data.
 */
export interface AppSession {
  sessionId?: string
}

/**
 * Read (or lazily create) the session for the current request. Only valid in a
 * request scope (Route Handler / Server Action) where `cookies()` is writable.
 * Options are built here, not at module top level, so importing this module
 * (e.g. during `next build` page-data collection) does not require
 * SESSION_PASSWORD to be present.
 */
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
      // 2 hours, rolling: iron-session re-stamps Max-Age on every save(), so an
      // active session slides forward while an idle one expires after 2h.
      maxAge: 60 * 60 * 2,
    },
  }
  return getIronSession<AppSession>(cookieStore, sessionOptions)
}
