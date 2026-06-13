import { bidStatus, gnotEstimate } from "./calc"
import type { MyBid } from "./types"

/**
 * Per-bidder outcome at settlement, derived from the final clearing price and the
 * bidder's own commitment.
 *
 * The Sonar SDK exposes NO per-commitment fill/refund field: ReadCommitmentDataResponse
 * gives the sale-wide ClearingPrice plus each commitment's price + amount only
 * (sonar-core@0.15.0). Fill is therefore derived here, at binary fidelity - a bid at or
 * above the clearing fills in full, a bid below it does not.
 *
 * Limit of binary fill: a MARGINAL winner (price exactly at the clearing) is pro-rata
 * filled on-chain, so it can carry a partial refund this model reports as zero. No money
 * is at risk - the contract's claimRefund() refunds the true unfilled amount regardless
 * of the UI - but the marginal winner is not prompted to claim. TODO(real-data): once
 * SettlementSale is deployed, read the real claimable refund from the contract at
 * Stage.Done (a view, not this derivation) and gate the claim button on it.
 */
export type SettlementOutcome = {
  status: "won" | "outbid"
  committedUsd: number
  filledUsd: number
  refundableUsd: number
  gnotAllocation: number
}

export function deriveSettlement(
  myBid: MyBid,
  clearingPriceUsd: number | null,
): SettlementOutcome | null {
  if (!myBid) return null
  // Indeterminate until a positive clearing price is known (always set once ended).
  if (!clearingPriceUsd || clearingPriceUsd <= 0) return null
  const won = bidStatus(myBid.priceUsd, clearingPriceUsd) === "winning"
  const filledUsd = won ? myBid.committedUsd : 0
  return {
    status: won ? "won" : "outbid",
    committedUsd: myBid.committedUsd,
    filledUsd,
    refundableUsd: myBid.committedUsd - filledUsd,
    gnotAllocation: won ? gnotEstimate(filledUsd, clearingPriceUsd) : 0,
  }
}
