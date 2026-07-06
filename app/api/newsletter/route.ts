import { subscribePending } from "@/lib/newsletter/mailchimp"
import { ipHmac, parseForwardedFor } from "@/lib/security/ip"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

// `topic` is the honeypot field: humans never see it, naive bots fill it.
const bodySchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  topic: z.string().max(200).optional().default(""),
})

// Route handlers get no bodySizeLimit (next.config covers server actions only); cap before parsing.
const MAX_BODY_BYTES = 4096

// Per-IP sliding window, in-memory per instance; keyed by HMAC-peppered IP (never raw).
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5
const MAX_TRACKED_KEYS = 10_000
const hits = new Map<string, number[]>()

function rateLimited(key: string, now: number): boolean {
  if (hits.size > MAX_TRACKED_KEYS) hits.clear()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  const limited = recent.length >= MAX_PER_WINDOW
  if (!limited) recent.push(now)
  hits.set(key, recent)
  return limited
}

// POST /api/newsletter
// Anti-enumeration: every accepted request returns the same 202; email never logged or stored.
export async function POST(request: Request) {
  let parsed: z.infer<typeof bodySchema>
  try {
    if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw new Error("too_large")
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) throw new Error("too_large")
    parsed = bodySchema.parse(JSON.parse(raw))
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }
  if (parsed.topic !== "") {
    // Honeypot tripped: pretend success, call nothing upstream.
    return NextResponse.json({ ok: true }, { status: 202 })
  }
  // Prefer Netlify's connection IP (unspoofable) over x-forwarded-for.
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
