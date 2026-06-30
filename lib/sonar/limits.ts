import "server-only"
import type { LimitsResponse } from "@echoxyz/sonar-core"
import { env } from "../env"
import type { LimitsSnapshot } from "../sale/types"
import { createSonarClient } from "./client"
import { readSaleDecimals } from "./commitments"
import { SonarAuthError, ensureFreshTokens, withSonarAuth } from "./permit"

// Sonar fetchLimits returns commitment min/max as strings in the payment token's smallest units
// (A.17.7). The decimals are read dynamically from the sale's commitment data, never hardcoded.

/** Normalize Sonar's LimitsResponse to USD using the payment token's decimals. 0 max = no cap. */
export function mapLimits(res: LimitsResponse, decimals: number): LimitsSnapshot {
  const unit = 10 ** decimals
  const maxUsd = Number(res.MaxCommitmentAmount) / unit
  return {
    minUsd: Number(res.MinCommitmentAmount) / unit,
    maxUsd: maxUsd > 0 ? maxUsd : null,
    hasCustom: res.HasCustomCommitmentAmountLimit,
  }
}

/** Read the wallet's commitment limits from Sonar (authenticated, per-wallet). */
export async function readLimits(
  sessionId: string,
  wallet: string,
): Promise<LimitsSnapshot | null> {
  const tokens = await ensureFreshTokens(sessionId)
  let res: LimitsResponse
  try {
    res = await withSonarAuth(sessionId, () =>
      createSonarClient(tokens.accessToken).fetchLimits({
        saleUUID: env.SONAR_SALE_UUID,
        walletAddress: wallet,
      }),
    )
  } catch (err) {
    if (err instanceof SonarAuthError) throw err
    // No per-wallet limits available (e.g. the wallet isn't linked to a Sonar entity yet ->
    // "entity not found"). fetchLimits is a best-effort enhancement, so fall back to the sale
    // defaults instead of erroring - the on-chain minAmount is the authoritative gate anyway.
    return null
  }
  const decimals = await readSaleDecimals()
  return mapLimits(res, decimals)
}
