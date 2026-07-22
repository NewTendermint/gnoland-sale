"use client"

import { useViewFocus } from "@/lib/a11y/focus"
import { SALE_CHAIN } from "@/lib/sale/contracts"
import { SALE_ECONOMICS, formatSaleDate } from "@/lib/sale/economics"
import { fmtGnot, fmtPrice, fmtUsd } from "@/lib/sale/format"
import type { ClaimGate, ClaimResult } from "@/lib/sale/onchain"
import { usePendingBid } from "@/lib/sale/pending-bid"
import { deriveClaimView, deriveSettlement } from "@/lib/sale/settlement"
import type { MyBid } from "@/lib/sale/types"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useAccount } from "wagmi"
import { WalletButton } from "../../(layout)/WalletButton"
import { Cta } from "../../(ui)/Cta"
import { GnotCoin } from "../../(ui)/GnotCoin"
import { Icon } from "../../(ui)/Icon"
import { ConnectChoices } from "./BidFlow"
import { FirstDayBonusNote } from "./BonusNote"

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
  gate,
  previewConnected,
}: {
  clearingPriceUsd: number | null
  myBid: MyBid
  onClaim?: () => Promise<ClaimResult>
  /** On-chain claim gate (stage Done + claimRefundEnabled + true refundable). undefined =
   *  unresolved: the claim button stays hidden (fail-closed) and derived numbers display. */
  gate?: ClaimGate
  /** Dev-gallery override (same precedent as BidFlow's preview); production leaves it unset. */
  previewConnected?: boolean
}) {
  const t = useTranslations("Bid")
  const locale = useLocale()
  const { isConnected, address } = useAccount()
  const connected = previewConnected ?? isConnected
  // Existence only, never its numbers: the settlement figures stay pure Sonar/on-chain data.
  const pendingBid = usePendingBid(address)
  const [claimState, setClaimState] = useState<"idle" | "claiming" | "claimed">("idle")
  const [claimError, setClaimError] = useState<string | null>(null)
  // The claim button disables on "claiming" and unmounts on "claimed", both of which drop focus
  // to <body>; refocus the flow so the outcome is reachable and announced.
  const viewRef = useViewFocus<HTMLDivElement>(claimState)

  if (!connected) {
    return <ConnectChoices prompt={t("settlementConnectPrompt")} />
  }

  const settlement = deriveSettlement(myBid, clearingPriceUsd)
  // All display assertions come from the pure merge in lib/sale/settlement.ts (fail-closed: only
  // the contract's own numbers open the button, and `won` already carries the zero-fill
  // downgrade to the refund-only rendering).
  const {
    refundableUsd,
    gnotAllocation,
    won,
    zeroFill,
    refunded,
    showClaimButton,
    showAutoRefundLine,
  } = deriveClaimView(settlement, gate, claimState === "claimed")

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

  const claimActions = (
    <div className="ml-auto flex items-center gap-4">
      {refunded ? (
        <output className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon name="shield-check" draw={false} className="h-5 w-5 shrink-0 text-mint" />
          {t("refundSent")}
        </output>
      ) : showClaimButton ? (
        <Cta variant="solid-contrast" onClick={onClaimClick} disabled={claimState === "claiming"}>
          {claimState === "claiming"
            ? t("claiming")
            : t("claimAmount", { amount: fmtUsd(refundableUsd) })}
        </Cta>
      ) : showAutoRefundLine ? (
        <span className="text-sm text-muted">{t("refundsAutomatic")}</span>
      ) : null}
      <WalletButton />
    </div>
  )

  const claimErrorLine = claimError ? (
    <p role="alert" className="text-xs font-medium text-danger">
      {claimError === "wrong-chain" ? t("claimWrongChain", { chain: SALE_CHAIN.name }) : claimError}
    </p>
  ) : null

  if (!settlement) {
    // The contract's truth outranks Sonar's absence: a gate that asserts a refund (claimable,
    // automatic, or already sent) must render actionable even with no position data at all -
    // hiding a claimable refund behind "no commitment" strands the bidder.
    if (refunded || showClaimButton || showAutoRefundLine) {
      return (
        <div ref={viewRef} tabIndex={-1} className="flex flex-col gap-5 focus:outline-none">
          <div className="flex items-center gap-3">
            <Icon name="shield-check" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
            <p className="text-sm text-foreground">{t("resultsSyncing")}</p>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
            <Cell label={t("cellRefundable")}>{fmtUsd(refundableUsd)}</Cell>
            {claimActions}
          </div>
          {claimErrorLine}
        </div>
      )
    }
    // A bid confirmed in the last pre-close minute outruns Sonar's indexer: until it reports (the
    // pending poll self-resolves this) or the pending TTL lapses, an empty answer is not "no bid".
    // Same for a wallet the gate KNOWS on-chain (refundableUsd non-null covers a fully-accepted
    // winner awaiting Sonar): denying its commitment would be false. One shared live region for
    // both messages, so the finalizing -> no-commitment transition mutates an existing region and
    // gets announced.
    return (
      <output className="flex flex-wrap items-center justify-between gap-4">
        {pendingBid || gate?.refundableUsd != null ? (
          <p className="text-sm">
            <span className="font-medium text-foreground">{t("finalizingTitle")}</span>{" "}
            <span className="text-muted">{t("finalizingBody")}</span>
          </p>
        ) : (
          <>
            <p className="text-sm">
              <span className="font-medium text-foreground">{t("noCommitmentTitle")}</span>{" "}
              <span className="text-muted">{t("noCommitmentBody")}</span>
            </p>
            <WalletButton />
          </>
        )}
      </output>
    )
  }

  const { committedUsd } = settlement

  return (
    <div ref={viewRef} tabIndex={-1} className="flex flex-col gap-5 focus:outline-none">
      <div className="flex items-center gap-3">
        <Icon
          name="shield-check"
          draw={false}
          className={`h-5 w-5 shrink-0 ${won ? "text-mint" : "text-foreground"}`}
        />
        <p className="text-sm text-foreground">
          {won ? t("outcomeWon") : zeroFill ? t("outcomeZeroFill") : t("outcomeOutbid")}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <Cell label={t("cellFinalClearingPrice")}>
            {fmtPrice(clearingPriceUsd ?? 0)} <span className="text-sm text-muted">/ GNOT</span>
          </Cell>
          <Cell label={t("cellCommitment")}>{fmtUsd(committedUsd)}</Cell>
          {won ? (
            <Cell label={t("cellAllocation")}>
              <GnotCoin className="h-5 w-5 text-muted" />~{fmtGnot(gnotAllocation)}
              <span className="text-sm text-muted">GNOT</span>
            </Cell>
          ) : null}
          <Cell label={t("cellRefundable")}>{fmtUsd(refundableUsd)}</Cell>
        </div>

        {claimActions}
      </div>

      {claimErrorLine}
      {won ? (
        <p className="text-xs text-muted">
          {t("allocationNote", { date: formatSaleDate(SALE_ECONOMICS.mainnetIso, true, locale) })}
        </p>
      ) : null}
      {won ? <FirstDayBonusNote /> : null}
    </div>
  )
}
