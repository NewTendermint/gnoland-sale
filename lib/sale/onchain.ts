"use client"

// The on-chain steps of the sale: the single swap point for going live.
// Going-live footguns: convert amounts ONLY via usdToTokenUnits / priceUsdToMicroUsd
// (decimals from commitment data, never hardcoded; uint64 price scale unconfirmed,
// REQUIREMENTS A.12.1), and re-verify the ABI from Etherscan (A.3 Tier 1) before launch.
import type { BidParams, BidResult } from "./submitter"
import type { SalePermit } from "./types"

type OnChainBidArgs = {
  params: BidParams
  permit: SalePermit
  wallet: `0x${string}`
}

export type ClaimResult =
  | { status: "claimed"; txHash: string }
  | { status: "reverted"; reason: string }

export async function submitBidOnChain(args: OnChainBidArgs): Promise<BidResult> {
  // --- EMULATION (local dev only) - DELETE when the contract lands ---
  // TODO(real-data): swap for the real wagmi replaceBidWithPermit once SettlementSale is deployed.
  if (process.env.NODE_ENV !== "production") {
    if (!args.permit?.Signature) {
      return { status: "reverted", reason: "Missing purchase permit" }
    }
    return { status: "submitted", txHash: "0xemulated-no-onchain-tx" }
  }
  // --- end EMULATION ---

  // No contract wired yet (REQUIREMENTS A.1): never fake success on a real deploy.
  return { status: "reverted", reason: "On-chain bidding is not available yet" }
}

export async function claimRefundOnChain(_args: { wallet: `0x${string}` }): Promise<ClaimResult> {
  // --- EMULATION (local dev only) - DELETE when the contract lands ---
  // TODO(real-data): swap for the real wagmi claimRefund once SettlementSale is deployed.
  if (process.env.NODE_ENV !== "production") {
    return { status: "claimed", txHash: "0xemulated-no-onchain-tx" }
  }
  // --- end EMULATION ---

  // No contract wired yet (REQUIREMENTS A.1): never fake a refund on a real deploy.
  return { status: "reverted", reason: "Refund claims are not available yet" }
}
