"use client"

/**
 * The on-chain bid step: SettlementSale.replaceBidWithPermit. This is the SINGLE
 * boundary between the app and the chain, and the SINGLE swap point for going live.
 * useBid awaits it after the Sonar gates (pre-purchase + permit).
 *
 * WHY IT IS EMULATED TODAY
 * The SettlementSale contract is not deployed yet (REQUIREMENTS A.1: only Sonar can
 * provision the sale, so the address does not exist), and its PurchasePermitV3 struct
 * is not openly readable, so the real call cannot be written or tested. To exercise
 * the full UI funnel we emulate THIS ONE STEP off-chain. The emulation runs in local
 * dev only and is OFF on every deployed build (NODE_ENV === "production"), so a real
 * deployment never presents a fake "submitted" bid. This mirrors the server's
 * sonarMockEnabled guard, which is also production-off.
 *
 * GOING LIVE - delete the single EMULATION block below and drop the real wagmi path
 * into this function. Its signature, the caller (useBid), and every type stay the
 * same. The real body, using wagmi/core actions (callable here, no hooks):
 *   1. Bid struct (verified from SettlementSale.sol): { lockup: bool, price: uint64,
 *      amount: uint256 }. Scale params.amountUsd to the payment-token decimals and
 *      params.priceUsd to the contract's price scale.
 *   2. EIP-2612: signTypedData(wagmiConfig, ...) on the payment token (USDC) to get
 *      (erc20PermitDeadline, erc20PermitSignature bytes). Single-tx path, no approve.
 *   3. Map permit.PermitJSON (Sonar BasicPermitV3) -> the PurchasePermitV3 tuple;
 *      permit.Signature is the purchasePermitSignature bytes.
 *   4. writeContract(wagmiConfig, { address: <SETTLEMENT_SALE from env>, abi,
 *      functionName: "replaceBidWithPermit", args: [token, bid, purchasePermit,
 *      purchasePermitSignature, erc20PermitDeadline, erc20PermitSignature] }) -> txHash.
 *   5. Re-verify the ABI from Basescan (REQUIREMENTS A.3 Tier 1) before launch.
 */
import type { BidParams, BidResult } from "./submitter"
import type { SalePermit } from "./types"

/** Everything the real replaceBidWithPermit call consumes. Final shape; the body swaps. */
export type OnChainBidArgs = {
  params: BidParams
  permit: SalePermit
  wallet: `0x${string}`
}

export async function submitBidOnChain(args: OnChainBidArgs): Promise<BidResult> {
  // --- EMULATION (local dev only) - DELETE this block when the contract lands ---
  if (process.env.NODE_ENV !== "production") {
    // Require the Sonar permit the real call would submit, so the funnel exercises
    // the actual precondition rather than blindly succeeding. No transaction is sent.
    if (!args.permit?.Signature) {
      return { status: "reverted", reason: "Missing purchase permit" }
    }
    return { status: "submitted", txHash: "0xemulated-no-onchain-tx" }
  }
  // --- end EMULATION ---

  // No contract wired yet (REQUIREMENTS A.1): never fake success on a real deploy.
  return { status: "reverted", reason: "On-chain bidding is not available yet" }
}
