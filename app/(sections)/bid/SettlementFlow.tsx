"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { WalletButton } from "../../(layout)/WalletButton"
import { Cta } from "../../(ui)/Cta"
import { GnotCoin } from "../../(ui)/GnotCoin"
import { Icon } from "../../(ui)/Icon"
import { SALE_ECONOMICS, formatSaleDate } from "../../../lib/sale/economics"
import { fmtGnot, fmtPrice, fmtUsd } from "../../../lib/sale/format"
import type { ClaimResult } from "../../../lib/sale/onchain"
import { deriveSettlement } from "../../../lib/sale/settlement"
import type { MyBid } from "../../../lib/sale/types"
import { ConnectChoices } from "./BidFlow"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</span>
      <div className="flex h-8 items-center gap-2 font-mono text-lg tabular-nums text-foreground">
        {children}
      </div>
    </div>
  )
}

export function SettlementFlow({
  clearingPriceUsd,
  myBid,
  onClaim,
}: {
  clearingPriceUsd: number | null
  myBid: MyBid
  onClaim?: () => Promise<ClaimResult>
}) {
  const { isConnected } = useAccount()
  const [claimState, setClaimState] = useState<"idle" | "claiming" | "claimed">("idle")
  const [claimError, setClaimError] = useState<string | null>(null)

  if (!isConnected) {
    return (
      <ConnectChoices prompt="Connect the wallet you bid with to see your results and claim any refund." />
    )
  }

  const settlement = deriveSettlement(myBid, clearingPriceUsd)
  if (!settlement) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">
          <span className="font-medium text-foreground">No commitment for this wallet.</span>{" "}
          <span className="text-muted">Switch to the wallet you bid with.</span>
        </p>
        <WalletButton />
      </div>
    )
  }

  const { status, committedUsd, refundableUsd, gnotAllocation } = settlement
  const won = status === "won"
  const canClaim = refundableUsd > 0

  async function onClaimClick() {
    setClaimState("claiming")
    setClaimError(null)
    const result = onClaim ? await onClaim() : ({ status: "claimed", txHash: "0xmock" } as const)
    if (result.status === "claimed") {
      setClaimState("claimed")
    } else {
      setClaimState("idle")
      setClaimError(result.reason)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Icon
          name="shield-check"
          draw={false}
          className={`h-5 w-5 shrink-0 ${won ? "text-mint" : "text-foreground"}`}
        />
        <p className="text-sm text-foreground">
          {won
            ? "Your bid cleared. Here's your allocation."
            : "You were outbid. Your full commitment is refundable."}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <Cell label="Final clearing">
            {fmtPrice(clearingPriceUsd ?? 0)} <span className="text-sm text-muted">/ GNOT</span>
          </Cell>
          <Cell label="Your commitment">{fmtUsd(committedUsd)}</Cell>
          {won ? (
            <Cell label="Your allocation">
              <GnotCoin className="h-5 w-5 text-muted" />~{fmtGnot(gnotAllocation)}
              <span className="text-sm text-muted">GNOT</span>
            </Cell>
          ) : null}
          <Cell label="Refundable">
            {fmtUsd(refundableUsd)} <span className="text-sm text-muted">USDC</span>
          </Cell>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {claimState === "claimed" ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
              <Icon name="shield-check" draw={false} className="h-5 w-5 shrink-0 text-mint" />
              Refund sent
            </span>
          ) : canClaim ? (
            <Cta
              variant="solid-contrast"
              onClick={onClaimClick}
              disabled={claimState === "claiming"}
            >
              {claimState === "claiming" ? "Claiming..." : `Claim ${fmtUsd(refundableUsd)}`}
            </Cta>
          ) : null}
          <WalletButton />
        </div>
      </div>

      {claimError ? <p className="text-xs font-medium text-danger">{claimError}</p> : null}
      {won ? (
        <p className="text-xs text-muted">
          GNOT is sent to your wallet at mainnet ({formatSaleDate(SALE_ECONOMICS.mainnetIso)}), with
          the unlock schedule applied.
        </p>
      ) : null}
    </div>
  )
}
