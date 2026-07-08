import "server-only"
import type { ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { env } from "../env"
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

/** The sale's payment-token decimals from Sonar (public). The source of truth for converting
 *  smallest-units amounts (limits, commitments) to USD - read, never hardcoded. */
export async function readSaleDecimals(): Promise<number> {
  const res = await createSonarClient().readCommitmentData({ saleUUID: env.SONAR_SALE_UUID })
  return res.PaymentTokenDecimals
}

/**
 * Extract the session entity's own position from the commitment set, by per-sale id.
 * null when no commitment.
 * TODO(real-data): confirm against real Sonar - the price field (PriceMicroUSD vs
 * numerator/denominator), and whether an entity can hold multiple commitments
 * (this takes the first match; amounts are summed across its wallets).
 */
export function mapMyBid(res: ReadCommitmentDataResponse, saleSpecificEntityId: string): MyBid {
  // listAvailableEntities and readCommitmentData are two different Sonar endpoints with no
  // guaranteed hex-casing agreement; compare case-insensitively (both are already 0x-prefixed).
  const wanted = saleSpecificEntityId.toLowerCase()
  const mine = res.Commitments.find((c) => c.SaleSpecificEntityID.toLowerCase() === wanted)
  if (!mine) {
    return null
  }
  const priceUsd =
    mine.PriceMicroUSD != null
      ? Number(mine.PriceMicroUSD) / MICRO_USD
      : Number(mine.PriceNumerator) / Number(mine.PriceDenominator)
  const committedUsd =
    mine.Amounts.reduce((sum, a) => sum + Number(a.Amount), 0) / 10 ** res.PaymentTokenDecimals
  return { priceUsd, committedUsd }
}

/** Read the session's position (entity lookup authenticated, commitment read public);
 *  null when no entity or no commitment. */
export async function readMyBid(sessionId: string): Promise<MyBid> {
  const entities = await withSonarAuth(sessionId, (accessToken) =>
    createSonarClient(accessToken).listAvailableEntities({ saleUUID: env.SONAR_SALE_UUID }),
  )
  // Same ranked pick as getEntity: the position MUST belong to the same entity the journey shows.
  const entity = pickEntity(entities.Entities)
  if (!entity) {
    return null
  }
  // readCommitmentData is public; only the entity lookup above needs the session's token.
  const data = await createSonarClient().readCommitmentData({ saleUUID: env.SONAR_SALE_UUID })
  return mapMyBid(data, entity.SaleSpecificEntityID)
}
