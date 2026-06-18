import { env } from "@/lib/env"
import { readCommitments } from "@/lib/sonar/commitments"
import { NextResponse } from "next/server"

// GET /api/sonar/commitments - public live auction metrics.
export const runtime = "nodejs"
export const revalidate = 0

export async function GET() {
  try {
    const metrics = await readCommitments()
    // Pause shows in the UI within the CDN cache window; mutating routes 503 immediately.
    const data = { ...metrics, paused: env.SALE_PAUSED === "true" }
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=10, stale-while-revalidate=30" },
    })
  } catch {
    return NextResponse.json({ error: "commitments_unavailable" }, { status: 502 })
  }
}
