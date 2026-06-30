import { bidStatus, gnotEstimate } from "./calc"
import type { MyBid } from "./types"

/**
 * Per-bidder outcome at settlement. Reports every winner as 100% filled = an UPPER bound: under
 * pro-rata an oversubscribed sale scales EVERY winner down by the same fill ratio, so any winner
 * can carry a partial refund this derivation shows as zero. The SDK exposes no per-commitment fill
 * field; claimRefund() refunds the true amount on-chain regardless.
 * TODO(real-data): once SettlementSale is deployed, read the real claimable refund from the
 * contract at Stage.Done (a view, not this derivation) and gate the claim button on it.
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
