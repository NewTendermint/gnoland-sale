"use client"

import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { sepolia } from "viem/chains"
import { useChainId, useConnect, useSwitchChain } from "wagmi"
import { NewsletterForm } from "../../(layout)/NewsletterForm"
import { CloseButton } from "../../(ui)/CloseButton"
import { Cta } from "../../(ui)/Cta"
import { Icon } from "../../(ui)/Icon"
import { useViewFocus } from "../../../lib/a11y/focus"
import {
  clearEmailOptInDone,
  emailOptInDone,
  newsletterEnabled,
} from "../../../lib/newsletter/config"
import {
  bidHeadroomPct,
  gnotEstimate,
  snapBidPrice,
  validateBidAmount,
  validateBidPrice,
} from "../../../lib/sale/calc"
import { SALE_CHAIN } from "../../../lib/sale/contracts"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"
import { fmtCompact, fmtGnot, fmtPrice, fmtUsd } from "../../../lib/sale/format"
import { usePaymentTokens } from "../../../lib/sale/hooks"
import {
  SUPPORT_CONTACT_HREF,
  VERIFY_INCOMPLETE,
  VERIFY_STATUS,
  WELCOME_BACK,
} from "../../../lib/sale/labels"
import { defaultPaymentToken } from "../../../lib/sale/onchain"
import {
  type BidParams,
  type BidResult,
  type BidStage,
  MockBidSubmitter,
} from "../../../lib/sale/submitter"
import type { JourneyState, MyBid } from "../../../lib/sale/types"
import { usePushAlerts } from "./PushOptIn"

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
function WalletIcon({ src, className = "" }: { src?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <Icon name="wallet" draw={false} className={`h-5 w-5 text-muted ${className}`} />
  }
  return (
    <img
      src={src}
      alt=""
      className={`h-6 w-6 rounded-md ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

// Channel pitches (validated copy, single source): the compact menu is CTAs only, each dedicated
// view shows its own channel pitch (the CTA label already names the channel, so the email pitch
// carries only the privacy promise). PUSH_HINT is the settings tooltip for the granted state.
const EMAIL_PITCH = "Never linked to your wallet or bids."
const PUSH_PITCH = "Outbid alerts in your browser - never linked to your wallet or bids."
const PUSH_HINT =
  "Not receiving them? Turn on notifications for your browser in your system settings."

/** Post-bid opt-in row. Compact menu: one explainer + two icon CTAs (check icon once a channel
 *  is active). Clicking a CTA switches the slot to that channel's dedicated view; success and
 *  error copy lives ONLY in the dedicated views. Exported for the /dev/states gallery. */
export function PostBidOptIns({
  bidLimitUsd,
  onDetailChange,
}: {
  bidLimitUsd: number
  /** Fires when the slot enters/leaves a dedicated view, so the row can free horizontal space. */
  onDetailChange?: (detail: boolean) => void
}) {
  const { supported, status, enable } = usePushAlerts(bidLimitUsd)
  const [view, setViewRaw] = useState<"menu" | "email" | "push">("menu")
  const setView = (v: "menu" | "email" | "push") => {
    setViewRaw(v)
    onDetailChange?.(v !== "menu")
  }
  const [emailDone, setEmailDone] = useState(false)
  const emailEnabled = newsletterEnabled()

  // The flag is written by ANY NewsletterForm instance (footer, tiles, this panel).
  useEffect(() => {
    setEmailDone(emailOptInDone())
  }, [])

  const pushGranted = status === "granted"
  const pushOffered = supported && status !== "unsupported"

  if (view === "email") {
    return (
      <div className="ml-auto flex min-w-0 items-center justify-end gap-x-4">
        <div aria-hidden="true" className="h-8 w-px shrink-0 bg-border" />
        {emailDone ? (
          // Re-opened from the checked CTA: the subscription already happened, show the state,
          // with an escape hatch for a mistyped address (clears the browser flag only).
          <>
            <p className="flex items-center gap-2 whitespace-nowrap text-xs text-mint">
              <Icon name="shield-check" draw={false} className="h-4 w-4 shrink-0" />
              Confirmation email sent - check your inbox.
            </p>
            <button
              type="button"
              onClick={() => {
                clearEmailOptInDone()
                setEmailDone(false)
              }}
              className="cursor-pointer whitespace-nowrap text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              Use another email
            </button>
          </>
        ) : (
          <>
            <p className="min-w-0 max-w-[36ch] shrink text-right text-xs text-muted">
              {EMAIL_PITCH}
            </p>
            <span className="shrink-0">
              <NewsletterForm
                variant="inline"
                inputId="bid-panel-email"
                onSuccess={() => setEmailDone(true)}
              />
            </span>
          </>
        )}
        <CloseButton label="Back to notification options" onClick={() => setView("menu")} />
      </div>
    )
  }

  if (view === "push") {
    return (
      <div className="ml-auto flex min-w-0 items-center justify-end gap-x-4">
        <div aria-hidden="true" className="h-8 w-px shrink-0 bg-border" />
        {status === "working" ? (
          <p className="min-w-0 max-w-[36ch] shrink text-right text-xs text-muted">{PUSH_PITCH}</p>
        ) : status === "error" ? (
          <p className="min-w-0 max-w-[44ch] shrink text-right text-xs text-muted">
            Could not enable alerts. Check that notifications are allowed for your browser in your
            system settings, then retry.
          </p>
        ) : null}
        {status === "working" ? (
          <Cta variant="ghost-contrast" size="sm" className="shrink-0 whitespace-nowrap" disabled>
            Enabling
          </Cta>
        ) : status === "granted" ? (
          <p
            className="flex items-center gap-2 whitespace-nowrap text-xs text-mint"
            title={PUSH_HINT}
          >
            <Icon name="shield-check" draw={false} className="h-4 w-4 shrink-0" />
            Browser alerts on. We'll notify you if you're outbid.
          </p>
        ) : status === "denied" ? (
          <p className="text-xs text-muted">
            Notifications are blocked. Enable them for your browser in your system settings to get
            outbid alerts.
          </p>
        ) : status === "unsupported" ? (
          <p className="text-xs text-muted">
            Notifications are not available in this browser. Use email updates instead.
          </p>
        ) : (
          <Cta
            variant="ghost-contrast"
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={enable}
          >
            Retry
          </Cta>
        )}
        {status !== "working" ? (
          <CloseButton label="Back to notification options" onClick={() => setView("menu")} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="ml-auto flex min-w-0 items-center justify-end gap-x-3">
      {emailEnabled ? (
        <Cta
          variant="ghost-contrast"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          onClick={() => setView("email")}
        >
          <Icon
            name={emailDone ? "shield-check" : "send"}
            draw={false}
            className={`h-4 w-4 shrink-0 ${emailDone ? "text-mint" : ""}`}
          />
          {emailDone ? "Price updates on" : "Price updates"}
        </Cta>
      ) : null}
      {pushOffered ? (
        <Cta
          variant="ghost-contrast"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          title={pushGranted ? PUSH_HINT : undefined}
          onClick={() => {
            setView("push")
            if (status === "idle" || status === "error") enable()
          }}
        >
          <Icon
            name={pushGranted ? "shield-check" : "browser"}
            draw={false}
            className={`h-4 w-4 shrink-0 ${pushGranted ? "text-mint" : ""}`}
          />
          {pushGranted ? "Outbid alerts on" : "Outbid alerts"}
        </Cta>
      ) : null}
    </div>
  )
}

/** Block-explorer tx link for the receipt; null unless `hash` is a real 32-byte tx hash. */
function txExplorerUrl(hash: string, chainId: number): string | null {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return null
  const base = chainId === sepolia.id ? "https://sepolia.etherscan.io" : "https://etherscan.io"
  return `${base}/tx/${hash}`
}

// Dev-only pacing so the approve/sign steps are visible before the contract is wired.
const devStepPause = () =>
  process.env.NODE_ENV === "production"
    ? Promise.resolve()
    : new Promise<void>((resolve) => setTimeout(resolve, 650))

type SubmitState = "idle" | "confirming" | "submitting" | "approving" | "signing" | "submitted"

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
  onSignOut,
  setupHref,
  onBid,
  preview,
}: {
  journey: JourneyState
  returning?: boolean
  clearingPriceUsd: number | null
  myBid: MyBid
  onConnectSonar?: () => void
  onSignOut?: () => void
  setupHref: string
  onBid?: (p: BidParams, opts?: { onStage?: (s: BidStage) => void }) => Promise<BidResult>
  preview?: BidPreview
}) {
  return (
    <StateContent
      journey={journey}
      returning={returning}
      clearingPriceUsd={clearingPriceUsd}
      myBid={myBid}
      onConnectSonar={onConnectSonar}
      onSignOut={onSignOut}
      setupHref={setupHref}
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
  onSignOut,
  setupHref,
  onBid,
  preview,
}: {
  journey: JourneyState
  returning?: boolean
  clearingPriceUsd: number | null
  myBid: MyBid
  onConnectSonar?: () => void
  onSignOut?: () => void
  setupHref: string
  onBid?: (p: BidParams, opts?: { onStage?: (s: BidStage) => void }) => Promise<BidResult>
  preview?: BidPreview
}) {
  // Shared render path keeps BidRow's tree position across ready -> has-bid (stable key preserves the receipt).
  if (
    journey === "ready" ||
    journey === "has-bid-winning" ||
    journey === "has-bid-outbid" ||
    journey === "has-bid-pending"
  ) {
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
        <GateContent
          journey={journey}
          returning={returning}
          onConnectSonar={onConnectSonar}
          onSignOut={onSignOut}
          setupHref={setupHref}
        />
      </div>
    </div>
  )
}

function GateContent({
  journey,
  returning,
  onConnectSonar,
  onSignOut,
  setupHref,
}: {
  journey: JourneyState
  returning?: boolean
  onConnectSonar?: () => void
  onSignOut?: () => void
  setupHref: string
}) {
  switch (journey) {
    case "wrong-network":
      return <SwitchNetworkGate />
    case "kyc-incomplete":
      return (
        <GateRow
          icon={VERIFY_INCOMPLETE.icon}
          title={VERIFY_INCOMPLETE.title}
          cta={VERIFY_INCOMPLETE.cta}
          ctaHref={setupHref}
        />
      )
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
  secondary,
  tone = "default",
}: {
  icon: string
  title: string
  body?: string
  cta?: string
  onCta?: () => void
  ctaHref?: string
  secondary?: ReactNode
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
          {body ? <span className="ml-1.5 text-muted">{body}</span> : null}
        </p>
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        {ctaHref && cta ? (
          <Cta variant="solid-contrast" href={ctaHref} external>
            {cta}
          </Cta>
        ) : cta ? (
          <Cta variant="solid-contrast" onClick={onCta}>
            {cta}
          </Cta>
        ) : null}
        {secondary}
      </div>
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
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        {/* Same dashed DNA as the not-installed wallets, grouped with them on the left. */}
        <a
          href={FIND_WALLET_URL}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="Don't have a wallet? Find one (opens in a new tab)"
          title="Don't have one? Find a wallet"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-faint bg-surface-alt opacity-70 transition-all hover:opacity-100 focus-visible:opacity-100"
        >
          <Icon name="search" draw={false} className="h-5 w-5 text-muted" />
        </a>
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
            <WalletIcon src={WALLET_ICON_SRC[rec.id]} className="grayscale" />
          </a>
        ))}
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
              : `This sale runs on ${SALE_CHAIN.name}. Change your network to continue.`}
          </span>
        </p>
      </div>
      <Cta
        variant="solid-contrast"
        className="ml-auto"
        onClick={() => switchChain({ chainId: SALE_CHAIN.id })}
        disabled={isPending}
      >
        {isPending ? "Switching..." : `Switch to ${SALE_CHAIN.name}`}
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
    "wallet-not-linked": "This wallet is already linked to another account.",
    "outside-time-window": "Bidding is closed right now.",
    "session-expired": "Your Sonar session expired. Reconnect to continue.",
    "Connect your wallet": "Connect your wallet to bid.",
    "wrong-chain": `Switch to ${SALE_CHAIN.name} to bid.`,
    unknown: "Could not place your bid. Please try again.",
  }
  // On-chain reasons (bidRevertReason) are already messages; pass through if not a known code.
  return messages[reason] ?? reason
}

/** Small "+amount" pill shown on the bid CTAs when a raise adds USDC over the prior commitment. */
function DeltaCapsule({ added }: { added: number }) {
  if (!Number.isFinite(added) || added <= 0) return null
  return (
    <span className="rounded-full border border-current px-1.5 py-px text-[0.65em] font-bold tracking-normal opacity-70">
      +{fmtUsd(added)}
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
  onBid?: (p: BidParams, opts?: { onStage?: (s: BidStage) => void }) => Promise<BidResult>
  preview?: BidPreview
}) {
  const minPrice = SALE_ECONOMICS.startingPriceUsd
  const increment = SALE_ECONOMICS.bidIncrementUsd
  // no upper price cap; grid is floor-anchored: minPrice + k*increment
  const band = { minPriceUsd: minPrice, incrementUsd: increment }
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
  // Funding token for THIS transaction (contract model: one bid, per-tx payment token). The picker
  // only exists once the sale registers several tokens; until then behavior is byte-identical.
  const paymentTokens = usePaymentTokens().data
  const multiToken = (paymentTokens?.length ?? 0) > 1
  const [payTokenAddress, setPayTokenAddress] = useState<`0x${string}` | null>(null)
  const payToken = paymentTokens?.length
    ? (paymentTokens.find((t) => t.address === payTokenAddress) ??
      defaultPaymentToken(paymentTokens))
    : undefined
  // Picker lists the default first, not the contract's registration order.
  const orderedTokens =
    multiToken && paymentTokens
      ? [
          defaultPaymentToken(paymentTokens),
          ...paymentTokens.filter((t) => t !== defaultPaymentToken(paymentTokens)),
        ]
      : paymentTokens
  const [submitState, setSubmitState] = useState<SubmitState>(preview?.state ?? "idle")
  // True while the post-bid opt-in slot shows a dedicated view: the receipt row then hides its
  // Transaction link to free horizontal space for the email field / status text.
  const [optInDetail, setOptInDetail] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(preview?.txHash ?? null)
  const [submitError, setSubmitError] = useState<string | null>(preview?.error ?? null)
  const aliveRef = useRef(true)
  // One ref shared by the mutually-exclusive view containers below: each submit-state change
  // unmounts the element that held focus, so the incoming view takes it (and gets announced).
  const viewRef = useViewFocus<HTMLDivElement>(submitState)

  const priceNum = Number(price)
  const amountNum = Number(amount)
  const priceCheck = validateBidPrice(priceNum, {
    minPriceUsd: minPrice,
    incrementUsd: increment,
    prevPriceUsd: prevBid?.priceUsd,
  })
  const minCommitFloor = SALE_ECONOMICS.minCommitmentUsd
  const maxCommit = SALE_ECONOMICS.maxCommitmentUsd
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
      ? `Min price ${fmtPrice(minPrice)}.`
      : priceShown && priceCheck === "off-increment"
        ? `Bids move in $${increment} steps.`
        : priceShown && priceCheck === "below-previous" && prevBid
          ? `Raise above your current ${fmtPrice(prevBid.priceUsd)}.`
          : null
  const amountError =
    amountShown && amountCheck === "too-low"
      ? prevBid
        ? `Can’t go below your committed ${fmtUsd(prevBid.committedUsd)}.`
        : `Min ${fmtUsd(minCommitFloor)}.`
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

  const raiseNote =
    prevBid && priceValid && amountValid && !raisesSomething
      ? "Your bid is unchanged - raise the price or add funds."
      : null

  async function runSubmit() {
    setSubmitError(null)
    // lockup:false here = the user opt-in (no toggle surfaced). The compliance-forced US lockup
    // is applied in useBid from the trusted server entity region (Sonar A.17.8), not in the form.
    const params: BidParams = {
      priceUsd: priceNum,
      amountUsd: amountNum,
      lockup: false,
      token: payToken?.address,
    }
    if (onBid) {
      setSubmitState("submitting")
      const result = await onBid(params, {
        onStage: (s) => {
          if (aliveRef.current) setSubmitState(s)
        },
      })
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
    // /dev/states gallery (no real submitter): keep the paced approve/sign animation.
    setSubmitState("approving")
    await devStepPause()
    if (!aliveRef.current) return
    setSubmitState("signing")
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
      <div
        ref={viewRef}
        tabIndex={-1}
        className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 focus:outline-none"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium text-foreground">
              Commit {fmtUsd(amountNum)} at {fmtPrice(priceNum)} per GNOT?
            </span>
            <span className="ml-1.5 text-muted">
              You pay the final clearing price. Est.{" "}
              {estAtBid != null && estAtBid < est
                ? `~${fmtGnot(estAtBid)}-${fmtGnot(est)} GNOT`
                : `~${fmtGnot(est)} GNOT`}
              . Bids can be raised but not cancelled.
            </span>
          </p>
          {prevBid ? (
            <p className="mt-1 text-xs text-muted">
              {amountNum > prevBid.committedUsd
                ? `Only the ${fmtUsd(amountNum - prevBid.committedUsd)} difference is charged.`
                : "No additional funds - just sign."}
            </p>
          ) : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
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

  if (submitState === "submitting" || submitState === "approving" || submitState === "signing") {
    return (
      <div
        ref={viewRef}
        tabIndex={-1}
        className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 focus:outline-none"
      >
        <div className="flex items-center gap-3" aria-live="polite">
          <Icon name="clock" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
          <p className="text-sm">
            <span className="font-medium text-foreground">
              {submitState === "submitting"
                ? "Placing your bid..."
                : submitState === "approving"
                  ? `Approving ${payToken?.symbol ?? "USDC"}...`
                  : "Signing..."}
            </span>
            <span className="ml-1.5 text-muted">
              {submitState === "submitting"
                ? "Preparing your bid - check your wallet in a moment."
                : submitState === "approving"
                  ? `Approve ${payToken?.symbol ?? "USDC"} spending in your wallet.`
                  : "Confirm and sign the bid in your wallet."}
            </span>
          </p>
        </div>
      </div>
    )
  }

  if (submitState === "submitted") {
    const explorer = txHash ? txExplorerUrl(txHash, chainId) : null
    // One line, always: the confirmation and CTAs never wrap or shrink; the tiny privacy note
    // inside PostBidOptIns is the only elastic element (min-w-0, wraps its own text).
    return (
      <div
        ref={viewRef}
        tabIndex={-1}
        aria-live="polite"
        className="flex items-center justify-between gap-x-10 focus:outline-none"
      >
        <div className="flex shrink-0 items-center gap-3">
          <Icon name="shield-check" draw={false} className="h-5 w-5 shrink-0 text-mint" />
          <p className="whitespace-nowrap text-sm text-foreground">
            Bid submitted - {fmtUsd(amountNum)} at {fmtPrice(priceNum)} per GNOT.
          </p>
          {optInDetail ? null : explorer ? (
            <a
              href={explorer}
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              Transaction
            </a>
          ) : txHash ? (
            <span className="font-mono text-[11px] text-muted">tx {txHash}</span>
          ) : null}
        </div>
        <PostBidOptIns bidLimitUsd={priceNum} onDetailChange={setOptInDetail} />
      </div>
    )
  }

  return (
    <div ref={viewRef} tabIndex={-1} className="flex flex-col gap-2 focus:outline-none">
      {outbid ? (
        <p className="text-xs font-bold text-danger" role="alert">
          You've been outbid. Increase your bid to stay in the sale.
        </p>
      ) : null}
      <div className="flex flex-wrap items-start gap-x-5 gap-y-4">
        <div className="flex flex-col gap-1.5">
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
            hint={`If your bid meets or exceeds the final clearing price, it wins. You pay the clearing price, not your original bid. Bids are placed in $${increment} increments, starting from the $${minPrice} starting price.`}
            suffix={
              <>
                USD <span className="text-[0.7em] opacity-60">/ GNOT</span>
              </>
            }
            error={priceError}
            className="w-24"
          />
          {/* w-0 min-w-full: the note adopts the field's width instead of stretching the column. */}
          {priceError || amountError ? null : submitError ? (
            <p
              className="flex w-0 min-w-full items-baseline gap-1.5 text-xs font-medium text-danger"
              role="alert"
            >
              <span className="truncate">{submitError}</span>
              {SUPPORT_CONTACT_HREF ? (
                <a
                  href={SUPPORT_CONTACT_HREF}
                  className="shrink-0 underline underline-offset-2 hover:opacity-75"
                >
                  Support
                </a>
              ) : null}
            </p>
          ) : raiseNote ? (
            <p className="w-0 min-w-full truncate text-xs text-muted">{raiseNote}</p>
          ) : clearingNote ? (
            <p
              className={`w-0 min-w-full whitespace-nowrap text-xs ${
                clearingNote.tone === "warn" ? "font-medium text-amber" : "text-muted"
              }`}
            >
              {clearingNote.text}
              {clearingNote.tone === "ok" && estAtBid != null && estAtBid < est
                ? ` You'd still get ~${fmtCompact(estAtBid)} GNOT.`
                : ""}
            </p>
          ) : null}
        </div>
        <InputCell
          id="bid-amount"
          label="Amount (USD)"
          value={amount}
          onChange={onAmountChange}
          invalid={amountShown && amountCheck !== "ok"}
          placeholder={String(minCommitFloor)}
          hint={`The total USD you commit is the amount you pay if your bid wins. If you're outbid, you're fully refunded after the sale. Your GNOT allocation is calculated as: Amount (USD) / Clearing Price. Minimum commitment is ${fmtUsd(minCommitFloor)}, with no maximum.`}
          error={amountError}
          className="w-32"
          trailing={
            multiToken && orderedTokens ? (
              <TokenSelect
                tokens={orderedTokens}
                value={payToken?.address}
                onChange={setPayTokenAddress}
              />
            ) : undefined
          }
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
          </div>
          <p className="max-w-md truncate text-xs text-muted">at the current clearing price</p>
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
  trailing,
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
  /** Interactive node after the input (e.g. the payment-token picker) - rendered without the
   *  decorative suffix's aria-hidden. */
  trailing?: ReactNode
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
        {trailing ?? null}
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

/** Per-transaction funding token picker (the "USDC ▾" suffix of the Amount field); rendered only
 *  once the sale accepts several tokens. Native select: keyboard + screen reader for free. */
function TokenSelect({
  tokens,
  value,
  onChange,
}: {
  tokens: readonly { address: `0x${string}`; symbol: string }[]
  value?: `0x${string}`
  onChange: (address: `0x${string}`) => void
}) {
  return (
    <span className="relative ml-1 inline-flex items-center whitespace-nowrap font-mono text-sm text-muted transition-colors focus-within:text-foreground hover:text-foreground">
      <select
        aria-label="Payment token"
        value={value}
        onChange={(e) => onChange(e.target.value as `0x${string}`)}
        className="cursor-pointer appearance-none bg-transparent pr-[15px] outline-none"
      >
        {tokens.map((t) => (
          <option key={t.address} value={t.address}>
            {t.symbol}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 10 6"
        className="pointer-events-none absolute right-0 top-1/2 h-[6px] w-[9px] -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
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
