import "server-only"
import type { ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { env } from "../env"
import type { CommitmentMetrics, MyBid } from "../sale/types"
import { createSonarClient } from "./client"
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

/** The sale's payment-token decimals from Sonar (public). The source of truth for converting
 *  smallest-units amounts (limits, commitments) to USD - read, never hardcoded. */
export async function readSaleDecimals(): Promise<number> {
  const res = await createSonarClient().readCommitmentData({ saleUUID: env.SONAR_SALE_UUID })
  return res.PaymentTokenDecimals
}

/**
 * Extract the session entity's own position from the commitment set, by per-sale id.
 * null when no commitment; lockup defaults to false (absent from the Sonar shape).
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

/** Read the session's position (authenticated); null when no entity or no commitment. */
export async function readMyBid(sessionId: string): Promise<MyBid> {
  const entities = await withSonarAuth(sessionId, (accessToken) =>
    createSonarClient(accessToken).listAvailableEntities({ saleUUID: env.SONAR_SALE_UUID }),
  )
  const entity = entities.Entities[0]
  if (!entity) {
    return null
  }
  const data = await withSonarAuth(sessionId, (accessToken) =>
    createSonarClient(accessToken).readCommitmentData({ saleUUID: env.SONAR_SALE_UUID }),
  )
  return mapMyBid(data, entity.SaleSpecificEntityID)
}
