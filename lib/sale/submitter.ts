// Bid types + the /dev/states preview submitter. Real on-chain path: lib/sale/onchain.ts.
// token: the payment token funding THIS transaction's delta (omitted = the sale's first token).
export type BidParams = {
  priceUsd: number
  amountUsd: number
  lockup: boolean
  token?: `0x${string}`
}
export type BidResult =
  | { status: "submitted"; txHash: string }
  | { status: "reverted"; reason: string }

// Real wallet-prompt stages the bid flow emits so the UI shows a state only when the wallet
// actually opens: "approving" = EIP-2612 USDC permit signature, "signing" = the bid transaction.
export type BidStage = "approving" | "signing"

// Preview-only submitter for /dev/states.
export class MockBidSubmitter {
  async preflight(p: BidParams) {
    return p.amountUsd > 0 && p.priceUsd > 0
      ? ({ ok: true } as const)
      : ({ ok: false, reason: "Enter a price and amount" } as const)
  }

  async submit(_p: BidParams): Promise<BidResult> {
    return { status: "submitted", txHash: "0xmock" }
  }
}
