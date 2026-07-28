import { db } from "@/lib/db/client"
import { CRON_LEASE_TTL_S, acquireCronLease, releaseCronLease } from "@/lib/db/lease"
import { bidAttribution } from "@/lib/db/schema"
import { readEntityCommitmentsUsd } from "@/lib/sale/server-reads"
import { cronAuthFailure } from "@/lib/security/cron-auth"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const LEASE = "attribution-reconcile-cron"

// POST /api/attribution/reconcile - hourly scheduled-function target; bearer CRON_SECRET required.
// Reads each attributed entity's on-chain commitment and writes committed/accepted USD + status.
// Read-only on-chain and idempotent (re-reading + overwriting is safe). Deliberately NOT gated on
// saleIsLive: it must keep running after the sale closes to capture the settled `accepted` amounts.
export async function POST(req: Request) {
  const unauthorized = cronAuthFailure(req)
  if (unauthorized) return unauthorized

  if (!(await acquireCronLease(LEASE, CRON_LEASE_TTL_S))) {
    return NextResponse.json({ skipped: "locked" })
  }
  try {
    const ids = (
      await db.select({ id: bidAttribution.saleSpecificEntityId }).from(bidAttribution)
    ).map((r) => r.id)
    if (ids.length === 0) return NextResponse.json({ reconciled: 0, confirmed: 0 })

    // Read all commitments first (before any write), so an RPC failure aborts cleanly with no
    // half-updated table - the next hourly run retries the whole set.
    const commitments = await readEntityCommitmentsUsd(ids)
    // null = no on-chain source (no contract / no payment tokens yet). Skip WITHOUT writing, so a
    // provisioning gap can never downgrade already-confirmed rows to committed=0/attributed.
    if (commitments === null) return NextResponse.json({ skipped: "no-source" })

    let confirmed = 0
    for (const id of ids) {
      const c = commitments.get(id.toLowerCase())
      const committedUsd = c?.committedUsd ?? 0
      const acceptedUsd = c?.acceptedUsd ?? 0
      if (committedUsd > 0) confirmed++
      await db
        .update(bidAttribution)
        .set({
          committedUsd,
          acceptedUsd,
          reconciledAt: new Date(),
          status: committedUsd > 0 ? "confirmed" : "attributed",
        })
        .where(eq(bidAttribution.saleSpecificEntityId, id))
    }
    return NextResponse.json({ reconciled: ids.length, confirmed })
  } finally {
    await releaseCronLease(LEASE)
  }
}
