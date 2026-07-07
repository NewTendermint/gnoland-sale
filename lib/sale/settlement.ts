import { bidStatus, gnotEstimate } from "./calc"
import type { ClaimGate } from "./onchain"
import type { MyBid } from "./types"

/**
 * Per-bidder outcome at settlement. Reports every winner as 100% filled = an UPPER bound: under
 * pro-rata an oversubscribed sale scales EVERY winner down by the same fill ratio, so any winner
 * can carry a partial refund this derivation shows as zero. The SDK exposes no per-commitment fill
 * field. This stays a DISPLAY FALLBACK only: the claim button + refundable amount are gated by the
 * on-chain truth (readClaimGate in onchain.ts - stage Done + claimRefundEnabled + committed minus
 * accepted), which overrides these numbers in SettlementFlow once read.
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

export type ClaimView = {
  /** Display amount: the contract's number when readable (includes pro-rata partial refunds for
   *  winners), else the derived estimate above. */
  refundableUsd: number
  /** Winner allocation consistent with refundableUsd: scaled by the on-chain fill ratio when the
   *  contract's refundable is readable (accepted = committed - refund), else the derived upper
   *  bound. Zero for outbid. */
  gnotAllocation: number
  refunded: boolean
  showClaimButton: boolean
  showAutoRefundLine: boolean
}

/**
 * Merge the Sonar-derived settlement with the on-chain claim gate into what the UI may assert.
 * FAIL-CLOSED: only the contract's OWN refundable amount can open the claim button - the derived
 * estimate is display-only (it lies for pro-rata winners and for a wallet that is not the one
 * that committed on-chain). The "refunds are processed automatically" line requires done stage:
 * before Done nothing is claimable by anyone, so asserting "automatic" would be false for a
 * self-serve sale still in Settlement.
 */
export function deriveClaimView(
  settlement: SettlementOutcome,
  gate: ClaimGate | undefined,
  claimedLocally: boolean,
): ClaimView {
  const refunded = claimedLocally || gate?.refunded === true
  const onchainRefundable = gate?.refundableUsd ?? null
  // The contract does not zero committedAmountByToken on refund, so this stays the historical
  // refundable amount after "Refund sent" - which is what the cell should keep showing.
  const refundableUsd = onchainRefundable ?? settlement.refundableUsd
  // Keep the two numbers coherent: allocation = accepted / clearing and accepted = committed -
  // refund, so a winner's estimate scales by the same fill ratio the refund reveals. Clamped:
  // Sonar's committed can lag the chain (indexer delay), which would push the ratio negative.
  const fillRatio =
    onchainRefundable != null && settlement.committedUsd > 0
      ? Math.max(0, (settlement.committedUsd - onchainRefundable) / settlement.committedUsd)
      : 1
  const gnotAllocation =
    settlement.status === "won" ? settlement.gnotAllocation * fillRatio : settlement.gnotAllocation
  return {
    refundableUsd,
    gnotAllocation,
    refunded,
    // Both assertions key on the CONTRACT's amount, never the estimate: a wallet that is not the
    // one that committed on-chain must get neither the button nor the automatic-refunds promise.
    showClaimButton:
      gate?.done === true && gate.claimEnabled && !refunded && (onchainRefundable ?? 0) > 0,
    showAutoRefundLine:
      gate?.done === true && !gate.claimEnabled && !refunded && (onchainRefundable ?? 0) > 0,
  }
}
