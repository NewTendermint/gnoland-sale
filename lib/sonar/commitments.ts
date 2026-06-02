import "server-only"
import type { ReadCommitmentDataResponse } from "@echoxyz/sonar-core"
import { env } from "../env"
import type { CommitmentMetrics } from "../sale/types"
import { createSonarClient } from "./client"

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
