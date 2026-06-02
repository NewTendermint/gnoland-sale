import { readCommitments } from "@/lib/sonar/commitments"
import { NextResponse } from "next/server"

// GET /api/sonar/commitments
// Public live auction metrics. revalidate=0 keeps the origin always fresh; the
// CDN holds the response for 10s with a 30s stale-while-revalidate window, which
// matches the client's 10s poll without hammering Sonar.
export const runtime = "nodejs"
export const revalidate = 0

export async function GET() {
  try {
    const data = await readCommitments()
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" },
    })
  } catch {
    return NextResponse.json({ error: "commitments_unavailable" }, { status: 502 })
  }
}
