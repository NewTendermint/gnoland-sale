"use client"

/**
 * Wallet-dependent content of the expanded bid panel, isolated so BidPanel can
 * lazy-load it (next/dynamic, ssr:false) and keep the wallet stack out of the
 * initial page bundle. Wraps BidFlow + the disconnect control in WalletScope.
 */
import { BidFlow } from "../(sections)/bid/BidFlow"
import type { JourneyState, MyBid } from "../../lib/sale/types"
import { WalletButton } from "./WalletButton"
import { WalletScope } from "./WalletScope"

export function ExpandedWalletPanel({
  journey,
  clearingPriceUsd,
  myBid,
}: {
  journey: JourneyState
  clearingPriceUsd: number | null
  myBid: MyBid
}) {
  return (
    <WalletScope>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <BidFlow journey={journey} clearingPriceUsd={clearingPriceUsd} myBid={myBid} />
        </div>
        <WalletButton />
      </div>
    </WalletScope>
  )
}
