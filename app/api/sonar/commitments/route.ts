import { env } from "@/lib/env"
import { errorMessage } from "@/lib/log"
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
      headers: { "Cache-Control": "public, max-age=5, stale-while-revalidate=30" },
    })
  } catch (err) {
    // Most-polled route in the app: a Sonar outage surfaces here first, so leave a trace.
    console.error("sonar-commitments:", errorMessage(err))
    return NextResponse.json({ error: "commitments_unavailable" }, { status: 502 })
  }
}
