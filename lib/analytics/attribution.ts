import "server-only"
import { sql } from "drizzle-orm"
import { cookies } from "next/headers"
import { db } from "../db/client"
import { bidAttribution } from "../db/schema"
import { uuidToBytes16 } from "../sale/permit-map"
import {
  ATTRIBUTION_COOKIE,
  type InfluencerHandle,
  resolveAttributionHandle,
} from "./influencer-links"

/**
 * Record (or refresh, last-touch) the promoter attribution for a KYC entity. Keyed on the canonical
 * on-chain sale-specific entity id (uuidToBytes16), so it joins straight to entityStatesByIDs and a
 * person's repeat visits or extra wallets never double-count.
 *
 * The on-conflict update fires ONLY while `status = 'attributed'` AND the handle actually changes:
 * - a bidder already reconciled to `confirmed` is FROZEN - a later click on another promoter's link
 *   cannot re-credit their bid volume (last-touch applies only up to the bid, not after);
 * - a repeat read with the same handle is a no-op, so this doesn't churn the row on every poll.
 * First touch always inserts (default status 'attributed').
 *
 * Throws on a malformed id or a DB error; callers run it best-effort (captureAttributionFromCookie),
 * so attribution can never break the flow it rides on.
 */
export async function recordEntityAttribution(
  saleSpecificEntityId: string,
  handle: InfluencerHandle,
): Promise<void> {
  const key = uuidToBytes16(saleSpecificEntityId)
  await db
    .insert(bidAttribution)
    .values({ saleSpecificEntityId: key, influencerHandle: handle })
    .onConflictDoUpdate({
      target: bidAttribution.saleSpecificEntityId,
      set: { influencerHandle: handle, lastTouchAt: sql`now()` },
      setWhere: sql`${bidAttribution.status} = 'attributed' AND ${bidAttribution.influencerHandle} <> ${handle}`,
    })
}

/**
 * Best-effort: bind this KYC entity to the promoter handle carried by the attribution cookie, if any.
 * Called from EVERY authenticated action (entity read AND bid preamble), so the cookie-bearing device
 * is caught wherever the visitor authenticates Sonar - the device-agnostic half of attribution. Reads
 * the cookie server-side, validates it against the known-handle set, upserts. NEVER throws.
 */
export async function captureAttributionFromCookie(saleSpecificEntityId: string): Promise<void> {
  try {
    const handle = resolveAttributionHandle((await cookies()).get(ATTRIBUTION_COOKIE)?.value)
    if (handle) await recordEntityAttribution(saleSpecificEntityId, handle)
  } catch (err) {
    // Static detail only: a malformed-id error embeds the raw id in its message (permit-map.ts), and
    // the codebase never logs entity ids. The error name is enough to tell a DB fault from a bad id.
    console.error(
      "attribution capture failed (non-fatal):",
      err instanceof Error ? err.name : "unknown",
    )
  }
}
