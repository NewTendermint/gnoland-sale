import { subscribePending } from "@/lib/newsletter/mailchimp"
import { ipHmac, parseForwardedFor } from "@/lib/security/ip"
import { NextResponse } from "next/server"
import { z } from "zod"

// Node runtime: node:crypto (MD5 subscriber hash + the HMAC IP pepper).
export const runtime = "nodejs"

// Accepted body. The email is normalized (trim + lowercase) before validation;
// `topic` is the honeypot field: humans never see it, naive bots fill it.
const bodySchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  topic: z.string().max(200).optional().default(""),
})

// Per-IP sliding window, in-memory per instance: best-effort drive-by-spam guard,
// keyed by the HMAC-peppered IP (never raw, same posture as the audit log). The
// durable Edge limiter is tracked in the pre-launch hardening checklist alongside
// the permit dedup.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5
const MAX_TRACKED_KEYS = 10_000
const hits = new Map<string, number[]>()

function rateLimited(key: string, now: number): boolean {
  // Crude memory bound: a clear resets every window, which only ever errs toward
  // letting a request through, never toward blocking legit traffic.
  if (hits.size > MAX_TRACKED_KEYS) hits.clear()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  const limited = recent.length >= MAX_PER_WINDOW
  if (!limited) recent.push(now)
  hits.set(key, recent)
  return limited
}

// POST /api/newsletter
// Public capture endpoint. Anti-enumeration: every accepted request (including a
// honeypot drop and an already-subscribed address upstream) returns the same 202
// body, so the response never reveals whether an email is on the list. The email
// is never logged and never stored here; Mailchimp (double opt-in) is the only
// data holder.
export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  if (parsed.topic !== "") {
    // Honeypot tripped: pretend success, call nothing upstream.
    return NextResponse.json({ ok: true }, { status: 202 })
  }
  // Prefer Netlify's connection IP (unspoofable) over x-forwarded-for, same as
  // the bid routes.
  const ip =
    request.headers.get("x-nf-client-connection-ip") ??
    parseForwardedFor(request.headers.get("x-forwarded-for"))
  if (rateLimited(ip ? ipHmac(ip) : "no-ip", Date.now())) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }
  const outcome = await subscribePending(parsed.email)
  if (outcome !== "ok") {
    return NextResponse.json({ error: "subscribe_failed" }, { status: 502 })
  }
  return NextResponse.json({ ok: true }, { status: 202 })
}
