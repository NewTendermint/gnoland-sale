"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { sepolia } from "viem/chains"
import { useChainId, useConnect, useSwitchChain } from "wagmi"
import { PRIMARY_CHAIN_ID } from "../../(layout)/web3"
import { GnotCoin } from "../../(ui)/GnotCoin"
import { Icon } from "../../(ui)/Icon"
import {
  gnotEstimate,
  snapBidPrice,
  validateBidAmount,
  validateBidPrice,
} from "../../../lib/sale/calc"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"
import { fmtGnot, fmtPriceUsdc, fmtUsdc } from "../../../lib/sale/format"
import { SUPPORT_CONTACT_HREF, VERIFY_STATUS, WELCOME_BACK } from "../../../lib/sale/labels"
import { type BidParams, type BidResult, MockBidSubmitter } from "../../../lib/sale/submitter"
import type { JourneyState, MyBid } from "../../../lib/sale/types"

const submitter = new MockBidSubmitter()

const BRAND_ICONS: Record<string, ReactNode> = {
  coinbaseWalletSDK: (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#0052FF" />
      <circle cx="16" cy="16" r="8" fill="#fff" />
      <rect x="13" y="13" width="6" height="6" rx="1.5" fill="#0052FF" />
    </svg>
  ),
  walletConnect: (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#3396FF" />
      <path
        fill="#fff"
        d="M10.2 13.4c3.2-3.13 8.4-3.13 11.6 0l.39.38a.4.4 0 0 1 0 .57l-1.33 1.3a.21.21 0 0 1-.29 0l-.53-.52c-2.24-2.19-5.87-2.19-8.11 0l-.57.56a.21.21 0 0 1-.29 0l-1.33-1.3a.4.4 0 0 1 0-.57l.46-.42zm14.33 2.67 1.18 1.16a.4.4 0 0 1 0 .57l-5.33 5.22a.42.42 0 0 1-.58 0l-3.78-3.7a.1.1 0 0 0-.15 0l-3.78 3.7a.42.42 0 0 1-.58 0l-5.33-5.22a.4.4 0 0 1 0-.57l1.18-1.16a.42.42 0 0 1 .58 0l3.78 3.7a.1.1 0 0 0 .15 0l3.78-3.7a.42.42 0 0 1 .58 0l3.78 3.7a.1.1 0 0 0 .15 0l3.78-3.7a.42.42 0 0 1 .58 0z"
      />
    </svg>
  ),
}

/** Block-explorer tx link for the receipt; null unless `hash` is a real 32-byte tx hash. */
function txExplorerUrl(hash: string, chainId: number): string | null {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return null
  const base = chainId === sepolia.id ? "https://sepolia.etherscan.io" : "https://etherscan.io"
  return `${base}/tx/${hash}`
}

// Dev-only pacing so the approve/sign steps are visible before the contract is wired;
// once wired, the wallet interactions provide the real timing and this is a no-op in prod.
const devStepPause = () =>
  process.env.NODE_ENV === "production"
    ? Promise.resolve()
    : new Promise<void>((resolve) => setTimeout(resolve, 650))

type SubmitState = "idle" | "confirming" | "approving" | "signing" | "submitted"

/** Dev-only: seed BidRow into a money-loop sub-state for the /dev/states gallery. */
export type BidPreview = {
  state: SubmitState
  amountUsd: number
  priceUsd?: number
  txHash?: string
  error?: string
}

export function BidFlow({
  journey,
  returning,
  clearingPriceUsd,
  myBid,
  onConnectSonar,
  onBid,
  walletButton,
  preview,
}: {
  journey: JourneyState
  returning?: boolean
  clearingPriceUsd: number | null
  myBid: MyBid
  onConnectSonar?: () => void
  onBid?: (p: BidParams) => Promise<BidResult>
  walletButton?: ReactNode
  preview?: BidPreview
}) {
  return (
    <StateContent
      journey={journey}
      returning={returning}
      clearingPriceUsd={clearingPriceUsd}
      myBid={myBid}
      onConnectSonar={onConnectSonar}
      onBid={onBid}
      walletButton={walletButton}
      preview={preview}
    />
  )
}

function StateContent({
  journey,
  returning,
  clearingPriceUsd,
  myBid,
  onConnectSonar,
  onBid,
  walletButton,
  preview,
}: {
  journey: JourneyState
  returning?: boolean
  clearingPriceUsd: number | null
  myBid: MyBid
  onConnectSonar?: () => void
  onBid?: (p: BidParams) => Promise<BidResult>
  walletButton?: ReactNode
  preview?: BidPreview
}) {
  if (journey === "ready") {
    return (
      <BidRow
        clearingPriceUsd={clearingPriceUsd}
        onBid={onBid}
        walletButton={walletButton}
        preview={preview}
      />
    )
  }
  if (journey === "has-bid-winning" || journey === "has-bid-outbid") {
    return (
      <div className="flex w-full flex-col gap-2">
        {journey === "has-bid-outbid" ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-danger" role="alert">
            You've been outbid - raise to stay in
          </p>
        ) : null}
        <BidRow
          clearingPriceUsd={clearingPriceUsd}
          prevBid={myBid}
          onBid={onBid}
          walletButton={walletButton}
          preview={preview}
        />
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="min-w-0 flex-1">
        <GateContent journey={journey} returning={returning} onConnectSonar={onConnectSonar} />
      </div>
      {walletButton}
    </div>
  )
}

function GateContent({
  journey,
  returning,
  onConnectSonar,
}: {
  journey: JourneyState
  returning?: boolean
  onConnectSonar?: () => void
}) {
  switch (journey) {
    case "wrong-network":
      return <SwitchNetworkGate />
    case "kyc-required":
      return returning ? (
        <GateRow
          icon={WELCOME_BACK.icon}
          title={WELCOME_BACK.title}
          body={WELCOME_BACK.body}
          cta={WELCOME_BACK.cta}
          onCta={onConnectSonar}
        />
      ) : (
        <GateRow
          icon="shield-check"
          title="Verify your identity"
          body="One-time verification with Sonar, about 3 minutes."
          cta="Verify with Sonar"
          onCta={onConnectSonar}
        />
      )
    case "kyc-pending":
      return (
        <GateRow
          icon={VERIFY_STATUS.pending.icon}
          title={VERIFY_STATUS.pending.title}
          body={VERIFY_STATUS.pending.body}
        />
      )
    case "kyc-failed":
      return (
        <GateRow
          icon={VERIFY_STATUS.failed.icon}
          tone={VERIFY_STATUS.failed.tone}
          title={VERIFY_STATUS.failed.title}
          body={VERIFY_STATUS.failed.body}
          cta={SUPPORT_CONTACT_HREF ? "Contact support" : undefined}
          ctaHref={SUPPORT_CONTACT_HREF ?? undefined}
        />
      )
    case "not-eligible":
      return (
        <GateRow
          icon={VERIFY_STATUS["not-eligible"].icon}
          tone={VERIFY_STATUS["not-eligible"].tone}
          title={VERIFY_STATUS["not-eligible"].title}
          body={VERIFY_STATUS["not-eligible"].body}
        />
      )
    default:
      return <ConnectChoices />
  }
}

function GateRow({
  icon,
  title,
  body,
  cta,
  onCta,
  ctaHref,
  tone = "default",
}: {
  icon: string
  title: string
  body: string
  cta?: string
  onCta?: () => void
  ctaHref?: string
  tone?: "default" | "danger"
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex items-center gap-3">
        <Icon
          name={icon}
          draw={false}
          className={`h-5 w-5 shrink-0 ${tone === "danger" ? "text-danger" : "text-foreground"}`}
        />
        <p className="text-sm">
          <span className="font-medium text-foreground">{title}.</span>
          <span className="ml-1.5 text-muted">{body}</span>
        </p>
      </div>
      {ctaHref && cta ? (
        <a href={ctaHref} target="_blank" rel="noreferrer" className="btn-pan bid-pill">
          <span className="inline-flex items-center gap-2">{cta}</span>
        </a>
      ) : cta ? (
        <button type="button" onClick={onCta} className="btn-pan bid-pill">
          <span className="inline-flex items-center gap-2">{cta}</span>
        </button>
      ) : null}
    </div>
  )
}

export function ConnectChoices({
  prompt = "Connect the wallet you'll bid with.",
}: { prompt?: string } = {}) {
  const { connectors, connect, isPending, variables, error } = useConnect()
  const pendingUid =
    variables?.connector && "uid" in variables.connector ? variables.connector.uid : undefined
  const seen = new Set<string>()
  const uniqueConnectors = connectors.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex items-center gap-3">
        <Icon name="wallet" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
        <p className="text-sm">
          <span className="font-medium text-foreground">Connect your wallet.</span>
          <span className={`ml-1.5 ${error ? "text-danger" : "text-muted"}`}>
            {error ? "Connection failed. Try again." : prompt}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {uniqueConnectors.map((connector) => {
          const pending = isPending && pendingUid === connector.uid
          return (
            <button
              key={connector.uid}
              type="button"
              onClick={() => connect({ connector })}
              disabled={isPending}
              aria-label={`Connect ${connector.name}`}
              title={connector.name}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-alt transition-colors hover:border-faint ${
                pending ? "animate-pulse" : isPending ? "opacity-40" : ""
              }`}
            >
              {connector.icon ? (
                <img src={connector.icon} alt="" className="h-6 w-6 rounded-md" />
              ) : (
                (BRAND_ICONS[connector.id] ?? (
                  <Icon name="wallet" draw={false} className="h-5 w-5 text-muted" />
                ))
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SwitchNetworkGate() {
  const { switchChain, isPending, error } = useSwitchChain()
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex items-center gap-3">
        <Icon name="network" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
        <p className="text-sm">
          <span className="font-medium text-foreground">Wrong network.</span>
          <span className={`ml-1.5 ${error ? "text-danger" : "text-muted"}`}>
            {error
              ? "Could not switch. Try again."
              : "This sale runs on Ethereum. Switch your wallet to continue."}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => switchChain({ chainId: PRIMARY_CHAIN_ID })}
        disabled={isPending}
        className="btn-pan bid-pill"
      >
        {/* .btn-pan requires the <span>: bare text paints under the panel. */}
        <span>{isPending ? "Switching..." : "Switch to Ethereum"}</span>
      </button>
    </div>
  )
}

function reasonToMessage(reason: string): string {
  const messages: Record<string, string> = {
    "requires-liveness": "An identity check is needed before bidding.",
    "wallet-risk": "This wallet can't be used for the sale.",
    "max-wallets-used": "You've reached the wallet limit for this sale.",
    "sale-not-active": "The sale isn't open right now.",
    "wallet-not-linked": "Link this wallet to your Sonar account first.",
    "outside-time-window": "Bidding is closed right now.",
    "session-expired": "Your Sonar session expired. Reconnect to continue.",
    unknown: "Could not place your bid. Please try again.",
  }
  return messages[reason] ?? messages.unknown
}

function BidRow({
  clearingPriceUsd,
  prevBid,
  onBid,
  walletButton,
  preview,
}: {
  clearingPriceUsd: number | null
  prevBid?: MyBid
  onBid?: (p: BidParams) => Promise<BidResult>
  walletButton?: ReactNode
  preview?: BidPreview
}) {
  const minPrice = SALE_ECONOMICS.startingPriceUsd
  const maxPrice = SALE_ECONOMICS.maxPriceUsd
  const increment = SALE_ECONOMICS.bidIncrementUsd
  const band = { minPriceUsd: minPrice, maxPriceUsd: maxPrice, incrementUsd: increment }
  const floor = snapBidPrice(
    Math.max(clearingPriceUsd ?? minPrice, prevBid?.priceUsd ?? 0, minPrice),
    band,
  )
  const [price, setPrice] = useState(
    preview?.priceUsd != null ? String(preview.priceUsd) : String(floor),
  )
  const [touched, setTouched] = useState(Boolean(preview))
  const [amount, setAmount] = useState(
    preview ? String(preview.amountUsd) : prevBid ? String(prevBid.committedUsd) : "",
  )
  function onAmountChange(v: string) {
    setTouched(true)
    setAmount(v)
  }
  const chainId = useChainId()
  const [submitState, setSubmitState] = useState<SubmitState>(preview?.state ?? "idle")
  const [txHash, setTxHash] = useState<string | null>(preview?.txHash ?? null)
  const [submitError, setSubmitError] = useState<string | null>(preview?.error ?? null)
  const aliveRef = useRef(true)

  const priceNum = Number(price)
  const amountNum = Number(amount)
  const priceCheck = validateBidPrice(priceNum, {
    minPriceUsd: minPrice,
    maxPriceUsd: maxPrice,
    incrementUsd: increment,
    prevPriceUsd: prevBid ? Math.min(prevBid.priceUsd, maxPrice) : undefined,
  })
  const amountCheck = validateBidAmount(
    amountNum,
    SALE_ECONOMICS.minCommitmentUsd,
    SALE_ECONOMICS.maxCommitmentUsd,
  )
  const priceShown = price !== "" && !Number.isNaN(priceNum)
  const amountShown = amount !== "" && !Number.isNaN(amountNum)

  const snappedRef = Number.isFinite(priceNum) && priceNum > 0 ? snapBidPrice(priceNum, band) : null
  const nextUp = snappedRef != null ? snapBidPrice(snappedRef + increment, band) : null
  const nextDown = snappedRef != null ? snapBidPrice(snappedRef - increment, band) : null
  function stepPrice(dir: 1 | -1) {
    setTouched(true)
    if (snappedRef == null) {
      setPrice(String(floor))
      return
    }
    const next = snapBidPrice(snappedRef + dir * increment, band)
    setPrice(String(Math.max(next, floor)))
  }
  useEffect(() => {
    if (!touched) setPrice(String(floor))
  }, [floor, touched])
  useEffect(
    () => () => {
      aliveRef.current = false
    },
    [],
  )
  const priceValid = priceShown && priceCheck === "ok"
  const amountValid = amountShown && amountCheck === "ok"
  const canSubmit = priceValid && amountValid && submitState === "idle"
  const est = gnotEstimate(amountValid ? amountNum : 0, clearingPriceUsd ?? minPrice)

  const priceError =
    priceShown && priceCheck === "below-min"
      ? `Min price ${fmtPriceUsdc(minPrice)}.`
      : priceShown && priceCheck === "above-max"
        ? `Max price ${fmtPriceUsdc(maxPrice)} - the hardcap.`
        : priceShown && priceCheck === "off-increment"
          ? `Bids move in ${increment} USDC steps.`
          : priceShown && priceCheck === "below-previous" && prevBid
            ? `Raise above your current ${fmtPriceUsdc(prevBid.priceUsd)}.`
            : null
  const amountError =
    amountShown && amountCheck === "too-low"
      ? `Min ${fmtUsdc(SALE_ECONOMICS.minCommitmentUsd)}.`
      : null

  const clearingNote =
    priceValid && clearingPriceUsd != null
      ? priceNum < clearingPriceUsd
        ? {
            tone: "warn" as const,
            text: `This price would be outbid (below ${fmtPriceUsdc(clearingPriceUsd)}).`,
          }
        : {
            tone: "ok" as const,
            text: `This price would be winning (clears ${fmtPriceUsdc(clearingPriceUsd)}).`,
          }
      : null

  async function runSubmit() {
    setSubmitError(null)
    const params: BidParams = { priceUsd: priceNum, amountUsd: amountNum, lockup: false }
    // Approve/sign preview runs in dev only; in prod we go straight to the seam so we never
    // imply a wallet step the stub can't deliver. TODO(real-data): drive these from the real
    // replaceBidWith{Approval,Permit} flow (approve only when the allowance is short, then the
    // bid tx) and stop hardcoding lockup=false.
    if (process.env.NODE_ENV !== "production") {
      setSubmitState("approving")
      await devStepPause()
      if (!aliveRef.current) return
      setSubmitState("signing")
    }
    if (onBid) {
      const result = await onBid(params)
      if (!aliveRef.current) return
      if (result.status === "submitted") {
        setTxHash(result.txHash)
        setSubmitState("submitted")
      } else {
        setSubmitState("idle")
        setSubmitError(reasonToMessage(result.reason))
      }
      return
    }
    const pre = await submitter.preflight(params)
    if (!aliveRef.current) return
    if (!pre.ok) {
      setSubmitState("idle")
      return
    }
    await submitter.submit(params)
    if (!aliveRef.current) return
    setSubmitState("submitted")
  }

  if (submitState === "confirming") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium text-foreground">
              Commit {fmtUsdc(amountNum)} at max {fmtPriceUsdc(priceNum)} / GNOT?
            </span>
            <span className="ml-1.5 text-muted">
              You pay the final clearing price, not your max, and receive ~{fmtGnot(est)} GNOT. You
              can raise later, but you can't lower or cancel.
            </span>
          </p>
          {prevBid ? (
            <p className="mt-1 text-xs text-muted">
              {amountNum > prevBid.committedUsd
                ? `Only the added ${fmtUsdc(amountNum - prevBid.committedUsd)} is charged - your committed USDC carries over.`
                : "No extra USDC - your committed funds carry over, you just sign."}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={runSubmit} className="btn-pan bid-pill">
            <span>{prevBid ? "Confirm raise" : "Confirm bid"}</span>
          </button>
          <button
            type="button"
            onClick={() => setSubmitState("idle")}
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Back
          </button>
          {walletButton}
        </div>
      </div>
    )
  }

  if (submitState === "approving" || submitState === "signing") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="flex items-center gap-3" aria-live="polite">
          <Icon name="clock" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
          <p className="text-sm">
            <span className="font-medium text-foreground">
              {submitState === "approving" ? "Approving USDC..." : "Signing..."}
            </span>
            <span className="ml-1.5 text-muted">
              {submitState === "approving"
                ? "Approve the USDC spending in your wallet."
                : "Confirm and sign the bid in your wallet."}
            </span>
          </p>
        </div>
        {walletButton}
      </div>
    )
  }

  if (submitState === "submitted") {
    const explorer = txHash ? txExplorerUrl(txHash, chainId) : null
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Icon name="shield-check" draw={false} className="h-5 w-5 shrink-0 text-mint" />
          <p className="text-sm text-foreground">
            Bid submitted - {fmtUsdc(amountNum)} at {fmtPriceUsdc(priceNum)} / GNOT.
          </p>
          {explorer ? (
            <a
              href={explorer}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              View transaction
            </a>
          ) : txHash ? (
            <span className="font-mono text-[11px] text-muted">tx {txHash}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => setSubmitState("idle")} className="btn-pan bid-pill">
            <span>Raise your bid</span>
          </button>
          {walletButton}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <InputCell
          id="bid-price"
          label="Max price"
          value={price}
          onChange={setPrice}
          readOnly
          stepper={{
            onUp: () => stepPrice(1),
            onDown: () => stepPrice(-1),
            upDisabled: snappedRef != null && nextUp === snappedRef,
            downDisabled:
              snappedRef != null && (nextDown === snappedRef || (nextDown ?? 0) < floor),
            upLabel: "Raise the price one step",
            downLabel: "Lower the price one step",
          }}
          invalid={priceShown && priceCheck !== "ok"}
          hint={`You win at or above the final clearing price and pay the clearing price, not your max. Moves in ${increment} USDC steps up to the ${fmtPriceUsdc(maxPrice)} hardcap; raise-only.`}
          suffix="USDC / GNOT"
          error={priceError}
          className="w-24"
        />
        <InputCell
          id="bid-amount"
          label="Amount (USDC)"
          value={amount}
          onChange={onAmountChange}
          invalid={amountShown && amountCheck !== "ok"}
          placeholder={String(SALE_ECONOMICS.minCommitmentUsd)}
          hint={`The total USDC you pay if filled (refunded if outbid). GNOT received = amount / clearing price. Min ${fmtUsdc(SALE_ECONOMICS.minCommitmentUsd)}, no maximum.`}
          error={amountError}
          className="w-32"
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">You receive</span>
          <div className="flex h-12 items-center gap-2">
            <GnotCoin className="h-6 w-6 text-muted" />
            <span className="font-mono text-lg tabular-nums text-foreground">
              ~{fmtGnot(est)} <span className="text-muted">GNOT</span>
            </span>
          </div>
        </div>

        <div className="ml-auto flex flex-col gap-1.5">
          <span
            aria-hidden="true"
            className="invisible select-none text-[10px] uppercase tracking-[0.2em]"
          >
            .
          </span>
          <div className="flex h-12 items-center gap-4">
            <button
              type="button"
              onClick={() => setSubmitState("confirming")}
              disabled={!canSubmit}
              className="btn-pan bid-pill"
            >
              <span className="inline-flex items-center gap-2">
                {prevBid ? "Raise bid" : "Place bid"}
              </span>
            </button>
            {walletButton}
          </div>
        </div>
      </div>
      {priceError || amountError ? null : submitError ? (
        <p className="max-w-md truncate text-xs font-medium text-danger" role="alert">
          {submitError}
        </p>
      ) : clearingNote ? (
        <p
          className={`max-w-md truncate text-xs ${
            clearingNote.tone === "warn" ? "font-medium text-amber" : "text-muted"
          }`}
        >
          {clearingNote.text}
        </p>
      ) : null}
    </div>
  )
}

function sanitizeDecimal(v: string): string {
  const cleaned = v.replace(/[^0-9.]/g, "")
  const [head, ...rest] = cleaned.split(".")
  return rest.length > 0 ? `${head}.${rest.join("")}` : head
}

const STEP_BTN =
  "flex shrink-0 cursor-pointer items-center justify-center rounded-md px-3 py-2 font-mono text-base leading-none disabled:pointer-events-none disabled:opacity-30"

function InputCell({
  id,
  label,
  value,
  onChange,
  readOnly = false,
  prefix,
  suffix,
  error,
  invalid,
  placeholder,
  hint,
  stepper,
  className = "",
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  readOnly?: boolean
  prefix?: string
  suffix?: string
  error?: string | null
  invalid: boolean
  placeholder?: string
  hint?: string
  stepper?: {
    onUp: () => void
    onDown: () => void
    upDisabled?: boolean
    downDisabled?: boolean
    upLabel: string
    downLabel: string
  }
  className?: string
}) {
  const [hintFlash, setHintFlash] = useState(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )
  // Focusing the read-only price field flashes the steppers, so it reads as "use these".
  function flashStepper() {
    if (!stepper) return
    setHintFlash(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setHintFlash(false), 400)
  }
  const stepBtnCls = `${STEP_BTN} ${
    hintFlash
      ? "bg-on-contrast text-surface-contrast"
      : "bg-border text-muted hover:bg-border-strong hover:text-foreground"
  }`
  return (
    <div className="relative flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-[10px] uppercase tracking-[0.2em] text-muted">
          {label}
        </label>
        {hint ? <FieldHint text={hint} /> : null}
      </div>
      <div
        className={`flex h-12 items-center rounded-[var(--radius-md)] border bg-surface-alt ${
          stepper ? "pl-2" : "pl-3.5"
        } pr-3.5 transition-colors ${
          invalid
            ? "border-danger"
            : readOnly
              ? "border-border"
              : "border-border focus-within:border-faint"
        }`}
      >
        {stepper ? (
          <div className="mr-2 flex items-center gap-0.5">
            <button
              type="button"
              aria-label={stepper.downLabel}
              onClick={stepper.onDown}
              disabled={stepper.downDisabled}
              className={stepBtnCls}
            >
              -
            </button>
            <button
              type="button"
              aria-label={stepper.upLabel}
              onClick={stepper.onUp}
              disabled={stepper.upDisabled}
              className={stepBtnCls}
            >
              +
            </button>
          </div>
        ) : null}
        {prefix ? (
          <span aria-hidden="true" className="mr-1 font-mono text-lg text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => onChange(sanitizeDecimal(e.target.value))}
          onFocus={flashStepper}
          onKeyDown={
            stepper
              ? (e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault()
                    stepper.onUp()
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault()
                    stepper.onDown()
                  }
                }
              : undefined
          }
          aria-invalid={invalid || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${className} bg-transparent font-mono text-lg tabular-nums text-foreground outline-none`}
        />
        {suffix ? (
          <span aria-hidden="true" className="ml-1 whitespace-nowrap font-mono text-sm text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-0.5 w-0 min-w-full truncate text-xs font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

function FieldHint({ text }: { text: string }) {
  return (
    <span className="group/hint relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground focus-visible:text-foreground"
      >
        <Icon name="help" draw={false} className="h-3.5 w-3.5" />
      </button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-full z-[var(--z-modal)] mt-2 w-max max-w-[22rem] rounded-[var(--radius-md)] bg-on-contrast px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-surface-contrast opacity-0 shadow-lg transition-opacity duration-100 group-hover/hint:opacity-100 group-focus-within/hint:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}
