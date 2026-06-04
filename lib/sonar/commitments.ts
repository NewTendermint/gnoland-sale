import "server-only"
import type { ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { env } from "../env"
import type { CommitmentMetrics, MyBid } from "../sale/types"
import { createSonarClient } from "./client"
import { ensureFreshTokens, withSonarAuth } from "./permit"

const MICRO_USD = 1_000_000

/**
 * Normalize Sonar's raw commitment response into the UI-facing CommitmentData:
 * the total is in payment-token minor units (divide by 10^decimals; USDC/USDT
 * track USD ~1:1) and the clearing price is micro-USD. Clearing price is null
 * until the auction has cleared (the field is absent before then).
 *
 * Pure and exported so it can be unit-tested without a Sonar call.
 */
export function mapCommitmentData(res: ReadCommitmentDataResponse): CommitmentMetrics {
  return {
    totalCommittedUsd: Number(res.TotalCommitmentAmount) / 10 ** res.PaymentTokenDecimals,
    clearingPriceUsd:
      res.ClearingPriceMicroUSD != null ? Number(res.ClearingPriceMicroUSD) / MICRO_USD : null,
    uniqueCommitmentCount: res.UniqueCommitmentCount,
  }
}

/**
 * Read live commitment metrics from Sonar. Public data: no auth, no token, so
 * an unauthenticated client is used.
 */
export async function readCommitments(): Promise<CommitmentMetrics> {
  const res = await createSonarClient().readCommitmentData({ saleUUID: env.SONAR_SALE_UUID })
  return mapCommitmentData(res)
}

/**
 * Extract the session entity's own position from the full commitment set, matched
 * by its per-sale id. null when the entity has no commitment. Price uses the
 * micro-USD field (same convention as the clearing price), falling back to the
 * numerator/denominator ratio; the committed amount sums the entity's wallet
 * amounts in payment-token minor units. lockup is not part of the Sonar commitment
 * shape, so it defaults to false. Pure and exported for unit testing.
 *
 * TODO(real-data): confirm against real Sonar - the lockup source, the price field
 * (PriceMicroUSD vs numerator/denominator), and whether an entity can hold multiple
 * commitments (this takes the first match; amounts are summed across its wallets).
 */
export function mapMyBid(res: ReadCommitmentDataResponse, saleSpecificEntityId: string): MyBid {
  const mine = res.Commitments.find((c) => c.SaleSpecificEntityID === saleSpecificEntityId)
  if (!mine) {
    return null
  }
  const priceUsd =
    mine.PriceMicroUSD != null
      ? Number(mine.PriceMicroUSD) / MICRO_USD
      : Number(mine.PriceNumerator) / Number(mine.PriceDenominator)
  const committedUsd =
    mine.Amounts.reduce((sum, a) => sum + Number(a.Amount), 0) / 10 ** res.PaymentTokenDecimals
  return { priceUsd, committedUsd, lockup: false }
}

/**
 * Read the session's position: resolve the entity (for its per-sale id), read the
 * commitment set, and pull out the entity's own commitment. Authenticated; null
 * when the session has no entity or no commitment.
 */
export async function readMyBid(sessionId: string): Promise<MyBid> {
  const tokens = await ensureFreshTokens(sessionId)
  const client = createSonarClient(tokens.accessToken)
  const entities = await withSonarAuth(sessionId, () =>
    client.listAvailableEntities({ saleUUID: env.SONAR_SALE_UUID }),
  )
  const entity = entities.Entities[0]
  if (!entity) {
    return null
  }
  const data = await withSonarAuth(sessionId, () =>
    client.readCommitmentData({ saleUUID: env.SONAR_SALE_UUID }),
  )
  return mapMyBid(data, entity.SaleSpecificEntityID)
}
