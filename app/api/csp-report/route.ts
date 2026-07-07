import { NextResponse } from "next/server"

export const runtime = "nodejs"

// A violation storm should not become a log storm; the edge limiter caps the transport, this
// caps what one accepted request can emit.
const MAX_BODY_BYTES = 16_384
const MAX_REPORTS_PER_BODY = 10

// One compact PII-free line per violation: directive + blocked host only. No document-uri
// (query strings), no script samples ('report-sample' is deliberately not enabled).
function summarize(report: Record<string, unknown>): string | null {
  const directive = report["effective-directive"] ?? report.effectiveDirective
  if (typeof directive !== "string" || directive.length > 64) return null
  const blocked = report["blocked-uri"] ?? report.blockedURL
  let source = typeof blocked === "string" ? blocked.slice(0, 200) : "unknown"
  try {
    source = new URL(source).host
  } catch {
    // keep CSP keywords ("inline", "eval", "data") as-is
  }
  return `${directive} -> ${source}`
}

// POST /api/csp-report
// Receiver for both report formats: report-uri ({"csp-report": {...}}) and the Reporting API
// (report-to, an array of {type, body}). Unauthenticated by nature (browsers send these without
// credentials); always 204, never echoes input back.
export async function POST(request: Request) {
  const raw = await request.text().catch(() => "")
  if (raw.length === 0 || raw.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 204 })
  }
  try {
    const body = JSON.parse(raw)
    const reports: unknown[] = Array.isArray(body)
      ? body.map((r) => (r as { body?: unknown })?.body)
      : [(body as { "csp-report"?: unknown })["csp-report"] ?? body]
    for (const report of reports.slice(0, MAX_REPORTS_PER_BODY)) {
      if (typeof report !== "object" || report === null) continue
      const line = summarize(report as Record<string, unknown>)
      if (line) console.error("csp-report:", line)
    }
  } catch {
    // Malformed report: drop silently (nothing actionable, nothing to leak).
  }
  return new NextResponse(null, { status: 204 })
}
