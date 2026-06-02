/**
 * Bid types + the /dev/states preview submitter.
 *
 * BidParams / BidResult are the shared shapes the bid UI uses. MockBidSubmitter is
 * the preview-only impl behind /dev/states (no wallet, no Sonar) so every bid state
 * can be viewed in isolation. The INTEGRATED on-chain step for a real wallet lives in
 * lib/sale/onchain.ts (submitBidOnChain) - the single swap point for the real
 * SettlementSale.replaceBidWithPermit call (ABI source-verified, REQUIREMENTS A.12.1;
 * deployed address blocked, REQUIREMENTS A.1).
 */
export type BidParams = { priceUsd: number; amountUsd: number; lockup: boolean }
export type BidResult =
  | { status: "submitted"; txHash: string }
  | { status: "reverted"; reason: string }

export interface BidSubmitter {
  // mirrors the 1-tx EIP-2612 path; preflight() = useSimulateContract, submit() = writeContract
  preflight(p: BidParams): Promise<{ ok: true } | { ok: false; reason: string }>
  submit(p: BidParams): Promise<BidResult>
}

export class MockBidSubmitter implements BidSubmitter {
  async preflight(p: BidParams) {
    return p.amountUsd > 0 && p.priceUsd > 0
      ? ({ ok: true } as const)
      : ({ ok: false, reason: "Enter a price and amount" } as const)
  }

  async submit(_p: BidParams): Promise<BidResult> {
    return { status: "submitted", txHash: "0xmock" }
  }
}
