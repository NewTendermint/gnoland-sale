"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { sepolia } from "viem/chains"
import { useChainId, useConnect, useSwitchChain } from "wagmi"
import { PRIMARY_CHAIN_ID } from "../../(layout)/web3"
import { Cta } from "../../(ui)/Cta"
import { Icon } from "../../(ui)/Icon"
import {
  bidHeadroomPct,
  gnotEstimate,
  snapBidPrice,
  validateBidAmount,
  validateBidPrice,
} from "../../../lib/sale/calc"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"
import { fmtGnot, fmtPriceUsdc, fmtUsdc } from "../../../lib/sale/format"
import { useLimits } from "../../../lib/sale/hooks"
import { SUPPORT_CONTACT_HREF, VERIFY_STATUS, WELCOME_BACK } from "../../../lib/sale/labels"
import { type BidParams, type BidResult, MockBidSubmitter } from "../../../lib/sale/submitter"
import type { JourneyState, MyBid } from "../../../lib/sale/types"
import { PushOptIn } from "./PushOptIn"

const submitter = new MockBidSubmitter()

// Wallets we promote in the picker even when the visitor has not installed them (shown greyed with
// an install link). Match against a live connector by wagmi connector id OR EIP-6963 rdns; the
// lowercased-name check is a fallback for rdns values we could not confirm against the running app.
// FOOTGUN: the rdns/id values are best-effort - confirm them in-app (log connector.rdns) and verify
// each wallet end-to-end on the real bid flow before launch; this list IS a public "supported" claim.
type RecommendedWallet = { id: string; name: string; installUrl: string }
const RECOMMENDED_WALLETS: RecommendedWallet[] = [
  { id: "io.metamask", name: "MetaMask", installUrl: "https://metamask.io/download/" },
  {
    id: "coinbaseWalletSDK",
    name: "Coinbase Wallet",
    installUrl: "https://www.coinbase.com/wallet/downloads",
  },
  { id: "io.rabby", name: "Rabby", installUrl: "https://rabby.io/" },
]

const FIND_WALLET_URL = "https://ethereum.org/wallets/find-wallet/"

// Official wallet logos, served locally from public/wallets/. Keyed by wagmi connector id / EIP-6963
// rdns. Installed EIP-6963 wallets already supply their own icon; this map covers the connectors that
// don't (Coinbase SDK, WalletConnect) plus the greyed not-installed recommendations.
const WALLET_ICON_SRC: Record<string, string> = {
  "io.metamask": "/wallets/metamask.svg",
  coinbaseWalletSDK: "/wallets/coinbase.svg",
  "io.rabby": "/wallets/rabby.svg",
  walletConnect: "/wallets/walletconnect.svg",
}

/** Renders the wallet's local SVG, falling back to a generic wallet glyph if it is missing/unknown. */
function WalletIcon({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <Icon name="wallet" draw={false} className="h-5 w-5 text-muted" />
  }
  return <img src={src} alt="" className="h-6 w-6 rounded-md" onError={() => setFailed(true)} />
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
  preview,
}: {
  journey: JourneyState
  returning?: boolean
  clearingPriceUsd: number | null
  myBid: MyBid
  onConnectSonar?: () => void
  onBid?: (p: BidParams) => Promise<BidResult>
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
  preview,
}: {
  journey: JourneyState
  returning?: boolean
  clearingPriceUsd: number | null
  myBid: MyBid
  onConnectSonar?: () => void
  onBid?: (p: BidParams) => Promise<BidResult>
  preview?: BidPreview
}) {
  // ready + has-bid share one render path so BidRow keeps the SAME tree position across the
  // ready -> has-bid transition (after a first bid). Otherwise React remounts it and the freshly
  // set "submitted" receipt is lost. The stable key reinforces that identity.
  if (journey === "ready" || journey === "has-bid-winning" || journey === "has-bid-outbid") {
    return (
      <div className="flex w-full flex-col gap-2">
        <BidRow
          key="bid-row"
          clearingPriceUsd={clearingPriceUsd}
          prevBid={journey === "ready" ? undefined : myBid}
          outbid={journey === "has-bid-outbid"}
          onBid={onBid}
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
        <Cta variant="solid-contrast" href={ctaHref} external>
          {cta}
        </Cta>
      ) : cta ? (
        <Cta variant="solid-contrast" onClick={onCta}>
          {cta}
        </Cta>
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
  // Live = Coinbase SDK (always) + installed EIP-6963 wallets (+ WalletConnect once its projectId is
  // set). These are ready to use; recommended wallets not found here render greyed with an install link.
  const live = connectors.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
  const isLive = (rec: RecommendedWallet) =>
    live.some((c) => {
      const rdnsList = typeof c.rdns === "string" ? [c.rdns] : (c.rdns ?? [])
      return (
        c.id === rec.id ||
        rdnsList.includes(rec.id) ||
        c.name.toLowerCase() === rec.name.toLowerCase()
      )
    })
  const missing = RECOMMENDED_WALLETS.filter((rec) => !isLive(rec))
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
      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* Discreet escape hatch, inline to the left of the wallet buttons. */}
        <a
          href={FIND_WALLET_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="mr-1 inline-flex items-center gap-1 text-xs text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"
        >
          Don't have one? Find a wallet
          <span aria-hidden="true">↗</span>
        </a>
        {/* Greyed: recommended wallets not detected on this browser -> open the install page. */}
        {missing.map((rec) => (
          <a
            key={rec.id}
            href={rec.installUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Get ${rec.name} (opens in a new tab)`}
            title={`${rec.name} - not installed, click to get it`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-faint bg-surface-alt opacity-70 transition-all hover:opacity-100 focus-visible:opacity-100"
          >
            <WalletIcon src={WALLET_ICON_SRC[rec.id]} />
          </a>
        ))}
        {/* Ready: live connectors, grouped to the right. */}
        {live.map((connector) => {
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
                <WalletIcon src={WALLET_ICON_SRC[connector.id]} />
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
              : "This sale runs on Ethereum. Change your network to continue."}
          </span>
        </p>
      </div>
      <Cta
        variant="solid-contrast"
        onClick={() => switchChain({ chainId: PRIMARY_CHAIN_ID })}
        disabled={isPending}
      >
        {isPending ? "Switching..." : "Switch to Ethereum"}
      </Cta>
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

/** Small "+amount" pill shown on the bid CTAs when a raise adds USDC over the prior commitment. */
function DeltaCapsule({ added }: { added: number }) {
  if (!Number.isFinite(added) || added <= 0) return null
  return (
    <span className="rounded-full border border-current px-1.5 py-px text-[0.65em] font-bold tracking-normal opacity-70">
      +{fmtUsdc(added)}
    </span>
  )
}

function BidRow({
  clearingPriceUsd,
  prevBid,
  outbid,
  onBid,
  preview,
}: {
  clearingPriceUsd: number | null
  prevBid?: MyBid
  outbid?: boolean
  onBid?: (p: BidParams) => Promise<BidResult>
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
  const limits = useLimits()
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
  // A raise can only keep or increase the committed amount, never reduce it. With a prior bid the
  // floor is the existing commitment; otherwise the global minimum.
  // SDK first (Sonar fetchLimits, per-wallet); fallback to the published economics default ($100).
  const minCommitFloor = limits.data?.minUsd ?? SALE_ECONOMICS.minCommitmentUsd
  const maxCommit = limits.data?.maxUsd ?? SALE_ECONOMICS.maxCommitmentUsd
  const minCommit = prevBid ? Math.max(minCommitFloor, prevBid.committedUsd) : minCommitFloor
  const amountCheck = validateBidAmount(amountNum, minCommit, maxCommit)
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
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])
  const priceValid = priceShown && priceCheck === "ok"
  const amountValid = amountShown && amountCheck === "ok"
  // A raise must increase something: a higher price OR more committed USDC. Re-signing the exact
  // same bid (both unchanged) is a no-op, so the button stays disabled until one of them grows.
  const raisesSomething =
    !prevBid || priceNum > prevBid.priceUsd || amountNum > prevBid.committedUsd
  const canSubmit = priceValid && amountValid && raisesSomething && submitState === "idle"
  const est = gnotEstimate(amountValid ? amountNum : 0, clearingPriceUsd ?? minPrice)
  // Second estimate at the bidder's own max price - only meaningful while winning with margin
  // (bid > clearing). It is the floor of what they receive if the price climbs to their max.
  const showAtBid =
    amountValid && priceValid && clearingPriceUsd != null && priceNum > clearingPriceUsd
  const estAtBid = showAtBid ? gnotEstimate(amountNum, priceNum) : null

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
      ? prevBid
        ? `Can’t go below your committed ${fmtUsdc(prevBid.committedUsd)}.`
        : `Min ${fmtUsdc(minCommitFloor)}.`
      : null

  const headroom =
    priceValid && clearingPriceUsd != null ? bidHeadroomPct(priceNum, clearingPriceUsd) : null
  const clearingNote =
    priceValid && clearingPriceUsd != null
      ? priceNum < clearingPriceUsd
        ? {
            tone: "warn" as const,
            text: "Below the clearing price - would lose.",
          }
        : headroom && headroom > 0
          ? {
              tone: "ok" as const,
              text: `Clearing can rise ${(headroom * 100).toFixed(1)}% before you're outbid.`,
            }
          : {
              tone: "ok" as const,
              text: "At clearing - raise for headroom.",
            }
      : null

  // A valid raise where nothing has increased yet: explain why the button is disabled.
  const raiseNote =
    prevBid && priceValid && amountValid && !raisesSomething
      ? "Your bid is unchanged - raise the price or add USDC."
      : null

  async function runSubmit() {
    setSubmitError(null)
    // lockup:false here = the user opt-in (no toggle surfaced). The compliance-forced US lockup
    // is applied in useBid from the trusted server entity region (Sonar A.17.8), not in the form.
    const params: BidParams = { priceUsd: priceNum, amountUsd: amountNum, lockup: false }
    // Approve/sign preview runs in dev only; in prod we go straight to the seam so we never
    // imply a wallet step the stub can't deliver. TODO(real-data): drive these from the real
    // replaceBidWith{Approval,Permit} flow (approve only when the allowance is short, then the bid tx).
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
      } else if (process.env.NODE_ENV !== "production" && result.reason === "Connect your wallet") {
        // Demo walkthrough (mock): reach the success receipt even without a connected wallet.
        setTxHash(`0x${"a1b2c3d4".repeat(8)}`)
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
              Commit {fmtUsdc(amountNum)} at {fmtPriceUsdc(priceNum)} per GNOT?
            </span>
            <span className="ml-1.5 text-muted">
              You pay the final clearing price. Est. ~{fmtGnot(est)} GNOT. Bids can be raised but
              not cancelled.
            </span>
          </p>
          {prevBid ? (
            <p className="mt-1 text-xs text-muted">
              {amountNum > prevBid.committedUsd
                ? `Only the ${fmtUsdc(amountNum - prevBid.committedUsd)} difference is charged.`
                : "No additional USDC - just sign."}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Cta variant="solid-contrast" onClick={runSubmit}>
            Confirm bid
            <DeltaCapsule added={prevBid ? amountNum - prevBid.committedUsd : 0} />
          </Cta>
          <button
            type="button"
            onClick={() => setSubmitState("idle")}
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Back
          </button>
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
                ? "Approve USDC spending in your wallet."
                : "Confirm and sign the bid in your wallet."}
            </span>
          </p>
        </div>
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
            Bid submitted - {fmtUsdc(amountNum)} at {fmtPriceUsdc(priceNum)} per GNOT.
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
        <PushOptIn bidLimitUsd={priceNum} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {outbid ? (
        <p className="text-xs font-bold text-danger" role="alert">
          You've been outbid. Increase your bid to stay in the sale.
        </p>
      ) : null}
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <InputCell
          id="bid-price"
          label="Bid price"
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
          hint={`If your bid meets or exceeds the final clearing price, it wins. You pay the clearing price, not your original bid. Bids are placed in $${increment} increments, from the $${minPrice} starting price up to the $${maxPrice} maximum.`}
          suffix={
            <>
              USDC <span className="text-[0.7em] opacity-60">/ GNOT</span>
            </>
          }
          error={priceError}
          className="w-24"
        />
        <InputCell
          id="bid-amount"
          label="Amount (USDC)"
          value={amount}
          onChange={onAmountChange}
          invalid={amountShown && amountCheck !== "ok"}
          placeholder={String(minCommitFloor)}
          hint={`The total USDC you commit is the amount you pay if your bid wins. If you're outbid, you're fully refunded after the sale. Your GNOT allocation is calculated as: Amount (USDC) / Clearing Price. Minimum commitment is $${fmtUsdc(minCommitFloor)}, with no maximum.`}
          error={amountError}
          className="w-32"
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">You receive</span>
            <FieldHint text="Estimated GNOT based on the current clearing price. If the final clearing price is higher, your GNOT allocation will be lower." />
          </div>
          <div className="flex min-h-12 items-center gap-3">
            <span className="font-mono text-lg tabular-nums text-foreground">
              ~{fmtGnot(est)}
              <span className="ml-0.5 text-muted">GNOT</span>
            </span>
            <span className="text-[11px] leading-snug text-muted">
              at the current clearing price
              {estAtBid != null ? (
                <>
                  <br />~{fmtGnot(estAtBid)} if the price rises to your max bid
                </>
              ) : null}
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
            <Cta
              variant="solid-contrast"
              onClick={() => setSubmitState("confirming")}
              disabled={!canSubmit}
            >
              {prevBid ? "Raise bid" : "Place bid"}
              <DeltaCapsule added={prevBid ? amountNum - prevBid.committedUsd : 0} />
            </Cta>
          </div>
        </div>
      </div>
      {priceError || amountError ? null : submitError ? (
        <p className="max-w-md truncate text-xs font-medium text-danger" role="alert">
          {submitError}
        </p>
      ) : raiseNote ? (
        <p className="max-w-md truncate text-xs text-muted">{raiseNote}</p>
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
  suffix?: ReactNode
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
