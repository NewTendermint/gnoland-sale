// Bid types + the /dev/states preview submitter. Real on-chain path: lib/sale/onchain.ts.
export type BidParams = { priceUsd: number; amountUsd: number; lockup: boolean }
export type BidResult =
  | { status: "submitted"; txHash: string }
  | { status: "reverted"; reason: string }

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
