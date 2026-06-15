"use client"

/**
 * The on-chain steps of the sale: the single boundary between the app and the chain,
 * and the single swap point for going live. Two actions, both on the SettlementSale
 * contract (source-verified, REQUIREMENTS A.12.1):
 *   - submitBidOnChain  -> replaceBidWithPermit (live phase, awaited by useBid after
 *     the Sonar pre-purchase + permit gates).
 *   - claimRefundOnChain -> claimRefund (ended phase, Stage.Done; awaited by useClaim).
 *
 * Both are emulated today because SettlementSale is not deployed yet (REQUIREMENTS A.1:
 * only Sonar can provision the sale). The emulation runs in local dev only and is off on
 * every deployed build (NODE_ENV === "production"), so a real deployment never presents
 * a fake success. Going live = wire the real wagmi/core path (no hooks here) in each
 * function below; the signatures, callers and types stay the same.
 *
 * replaceBidWithPermit, real body:
 *   1. Bid struct (verified from SettlementSale.sol): { lockup: bool, price: uint64,
 *      amount: uint256 }. Convert ONLY through usdToTokenUnits / priceUsdToMicroUsd
 *      (lib/sale/calc.ts, integer-exact + tested): amount with the payment token's
 *      real decimals (PaymentTokenDecimals from commitment data, never hardcoded),
 *      price re-mapped once A.12.1 confirms the uint64 scale.
 *   2. EIP-2612: signTypedData(wagmiConfig, ...) on the payment token (USDC) for
 *      (erc20PermitDeadline, erc20PermitSignature bytes). Single-tx path, no approve.
 *   3. Map permit.PermitJSON (Sonar BasicPermitV3) to the PurchasePermitV3 tuple;
 *      permit.Signature is the purchasePermitSignature bytes.
 *   4. writeContract(wagmiConfig, { address: <SETTLEMENT_SALE from env>, abi,
 *      functionName: "replaceBidWithPermit", args: [token, bid, purchasePermit,
 *      purchasePermitSignature, erc20PermitDeadline, erc20PermitSignature] }) -> txHash.
 *   5. Re-verify the ABI from Etherscan (REQUIREMENTS A.3 Tier 1) before launch.
 *
 * claimRefund, real body: no Sonar permit and no amount - the contract refunds the
 * connected wallet's unfilled commitment at Stage.Done. Guard the chain (Ethereum) first,
 * then writeContract(wagmiConfig, { address: <SETTLEMENT_SALE from env>, abi,
 * functionName: "claimRefund", args: [] }) -> txHash. Re-verify the ABI (A.3 Tier 1).
 * Also read the REAL claimable refund from the contract to drive the UI figure + the
 * claim button (the ended-bar estimate is binary - see lib/sale/settlement.ts).
 */
import type { BidParams, BidResult } from "./submitter"
import type { SalePermit } from "./types"

/** Everything the real replaceBidWithPermit call consumes. Final shape; only the
 *  body swaps. Callers (useBid) build it inline and infer it from submitBidOnChain. */
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
  // TODO(real-data): swap for the real wagmi replaceBidWithPermit (see the going-live
  // steps in the file header) once SettlementSale is deployed.
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

export async function claimRefundOnChain(_args: { wallet: `0x${string}` }): Promise<ClaimResult> {
  // --- EMULATION (local dev only) - DELETE when the contract lands ---
  // TODO(real-data): swap for the real wagmi claimRefund (see the file header) once
  // SettlementSale is deployed. No transaction is sent.
  if (process.env.NODE_ENV !== "production") {
    return { status: "claimed", txHash: "0xemulated-no-onchain-tx" }
  }
  // --- end EMULATION ---

  // No contract wired yet (REQUIREMENTS A.1): never fake a refund on a real deploy.
  return { status: "reverted", reason: "Refund claims are not available yet" }
}
