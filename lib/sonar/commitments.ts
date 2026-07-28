import "server-only"
import type { ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { env } from "../env"
import { errorMessage } from "../log"
import { readEntityBid } from "../sale/server-reads"
import type { CommitmentMetrics, MyBid } from "../sale/types"
import { createSonarClient } from "./client"
import { pickEntity } from "./entity"
import { withSonarAuth } from "./permit"

const MICRO_USD = 1_000_000

/** Normalize Sonar's raw commitment response to UI USD. Clearing price null until cleared. */
export function mapCommitmentData(res: ReadCommitmentDataResponse): CommitmentMetrics {
  return {
    totalCommittedUsd: Number(res.TotalCommitmentAmount) / 10 ** res.PaymentTokenDecimals,
    clearingPriceUsd:
      res.ClearingPriceMicroUSD != null ? Number(res.ClearingPriceMicroUSD) / MICRO_USD : null,
    uniqueCommitmentCount: res.UniqueCommitmentCount,
  }
}

/** Read live commitment metrics from Sonar (public data, unauthenticated client). */
export async function readCommitments(): Promise<CommitmentMetrics> {
  const res = await createSonarClient().readCommitmentData({ saleUUID: env.SONAR_SALE_UUID })
  // The aggregates below are full-set, but Commitments is capped upstream at the latest rows.
  // Anything deriving per-entity data from that array is silently wrong past the cap.
  if (res.Commitments.length < res.UniqueCommitmentCount) {
    console.info(
      `sonar-commitments: upstream capped Commitments at ${res.Commitments.length} of ${res.UniqueCommitmentCount}`,
    )
  }
  return mapCommitmentData(res)
}

// Shields server-side readers only; the public GET route relies on its own CDN cache window.
// Per-instance and best-effort by design.
export const COMMITMENTS_CACHE_MS = 10_000

let commitmentsCache: { at: number; value: CommitmentMetrics } | null = null

/** readCommitments behind a short cache: shields Sonar from high-frequency server-side readers
 *  (the subscribe route is re-POSTed by PushLimitSync on every page load of a subscribed bidder).
 *  Failures are never cached - the next call retries upstream. */
export async function readCommitmentsCached(now: number = Date.now()): Promise<CommitmentMetrics> {
  if (commitmentsCache && now - commitmentsCache.at < COMMITMENTS_CACHE_MS) {
    return commitmentsCache.value
  }
  const value = await readCommitments()
  commitmentsCache = { at: now, value }
  return value
}

/**
 * An entity's position from Sonar's commitment set, by per-sale id. FALLBACK ONLY - readMyBid
 * reads the chain; this carries most sessions through an RPC outage.
 * CAP: `Commitments` holds only the latest rows, so null here means "not in the window", never an
 * authoritative "no bid".
 */
export function mapMyBid(res: ReadCommitmentDataResponse, saleSpecificEntityId: string): MyBid {
  // listAvailableEntities and readCommitmentData are two different Sonar endpoints with no
  // guaranteed hex-casing agreement; compare case-insensitively (both are already 0x-prefixed).
  const wanted = saleSpecificEntityId.toLowerCase()
  // Pre-1.0 upstream, validate at the boundary: the commitment set is shared across every
  // session, so one schema-violating row must not take down all my-position reads. Skipped
  // rows are logged (count only, ids may be unreadable) so the anomaly stays visible.
  const rows = res.Commitments.filter((c) => typeof c.SaleSpecificEntityID === "string")
  if (rows.length !== res.Commitments.length) {
    console.warn(
      `sonar-commitments: skipped ${res.Commitments.length - rows.length} malformed commitment row(s)`,
    )
  }
  const mine = rows.find((c) => c.SaleSpecificEntityID.toLowerCase() === wanted)
  if (!mine) {
    return null
  }
  const priceUsd =
    mine.PriceMicroUSD != null
      ? Number(mine.PriceMicroUSD) / MICRO_USD
      : Number(mine.PriceNumerator) / Number(mine.PriceDenominator)
  const committedUsd = Array.isArray(mine.Amounts)
    ? mine.Amounts.reduce((sum, a) => sum + Number(a.Amount), 0) / 10 ** res.PaymentTokenDecimals
    : Number.NaN
  // The session's OWN row malformed must fail loud (the route maps it to a 502 the UI retries),
  // never resolve to a silent wrong position - a false "no bid" on an irrevocable bid is the
  // exact failure confirmed-read exists to prevent.
  if (!Number.isFinite(priceUsd) || !Number.isFinite(committedUsd)) {
    throw new Error("sonar-commitments: malformed commitment row for session entity")
  }
  return { priceUsd, committedUsd }
}

/** Read the session's position; null when no entity or no bid. The entity lookup is authenticated
 *  and its id is ALWAYS server-derived, never client-supplied. The position itself comes from the
 *  contract (readEntityBid), which has no row cap, unlike readCommitmentData. */
export async function readMyBid(sessionId: string): Promise<MyBid> {
  const entities = await withSonarAuth(sessionId, (accessToken) =>
    createSonarClient(accessToken).listAvailableEntities({ saleUUID: env.SONAR_SALE_UUID }),
  )
  // Same ranked pick as getEntity: the position MUST belong to the same entity the journey shows.
  const entity = pickEntity(entities.Entities)
  if (!entity) {
    return null
  }
  try {
    return await readEntityBid(entity.SaleSpecificEntityID)
  } catch (err) {
    // Availability net, not a second source of truth: the chain's numbers win whenever it answers.
    // A miss in Sonar's capped window re-throws (502, the UI retries) rather than resolving to a
    // false "no bid". Worst case is a retry, never a hidden position.
    console.warn(
      `sonar-commitments: chain position read failed, trying Sonar: ${errorMessage(err)}`,
    )
    const data = await createSonarClient().readCommitmentData({ saleUUID: env.SONAR_SALE_UUID })
    const fromSonar = mapMyBid(data, entity.SaleSpecificEntityID)
    if (fromSonar == null) {
      throw err
    }
    return fromSonar
  }
}
