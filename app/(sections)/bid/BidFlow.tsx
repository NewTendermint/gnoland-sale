"use client"

/**
 * Presentational bid funnel for the expanded sticky bar. Takes (journey,
 * clearingPriceUsd, myBid); optional actions wire the connect/network gate buttons
 * to the real wallet (omitted by /dev/states, which previews every state without a
 * wallet). The /dev/states preview submits through MockBidSubmitter; the real path
 * calls onBid (useBid -> submitBidOnChain), where the wagmi replaceBidWithPermit
 * lands later (ABI source-verified, REQUIREMENTS A.12.1).
 * Visitor-facing copy here is placeholder, pending final wording.
 */
import { useState } from "react"
import type { ReactNode } from "react"
import { useConnect, useSwitchChain } from "wagmi"
import { PRIMARY_CHAIN_ID } from "../../(layout)/web3"
import { GnotCoin } from "../../(ui)/GnotCoin"
import { Icon } from "../../(ui)/Icon"
import { gnotEstimate, validateBidAmount, validateBidPrice } from "../../../lib/sale/calc"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"
import { fmtGnot, fmtPrice, fmtUsd } from "../../../lib/sale/format"
import { type BidParams, type BidResult, MockBidSubmitter } from "../../../lib/sale/submitter"
import type { JourneyState, MyBid } from "../../../lib/sale/types"

const submitter = new MockBidSubmitter()

// Inverted pill: on the .bid-capsule contrast surface, the CTA flips to a light
// pill with dark text (bg-on-contrast / text-surface-contrast).
const PILL =
  "btn-pan inline-flex cursor-pointer items-center justify-center rounded-full border border-faint bg-on-contrast px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-surface-contrast before:bg-surface-contrast hover:text-on-contrast disabled:cursor-not-allowed disabled:opacity-40"

// Brand logos for connectors that do not expose their own icon (keyed by connector id).
// EIP-6963 wallets (MetaMask, Keplr, ...) supply connector.icon; these two do not.
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

export function BidFlow({
  journey,
  clearingPriceUsd,
  myBid,
  onConnectSonar,
  onBid,
  walletButton,
}: {
  journey: JourneyState
  clearingPriceUsd: number | null
  myBid: MyBid
  onConnectSonar?: () => void
  onBid?: (p: BidParams) => Promise<BidResult>
  walletButton?: ReactNode
}) {
  // Content only. The funnel stepper is rendered by the bar's top (metrics) row.
  return (
    <StateContent
      journey={journey}
      clearingPriceUsd={clearingPriceUsd}
      myBid={myBid}
      onConnectSonar={onConnectSonar}
      onBid={onBid}
      walletButton={walletButton}
    />
  )
}

function StateContent({
  journey,
  clearingPriceUsd,
  myBid,
  onConnectSonar,
  onBid,
  walletButton,
}: {
  journey: JourneyState
  clearingPriceUsd: number | null
  myBid: MyBid
  onConnectSonar?: () => void
  onBid?: (p: BidParams) => Promise<BidResult>
  walletButton?: ReactNode
}) {
  // Bid-form states own their whole row (inputs + actions + wallet) so the live
  // note can sit on its own line below without dropping the buttons. Gate states
  // render their content with the wallet control aligned on the right.
  if (journey === "ready") {
    return <BidRow clearingPriceUsd={clearingPriceUsd} onBid={onBid} walletButton={walletButton} />
  }
  if (journey === "has-bid-winning" || journey === "has-bid-outbid") {
    // Both are a raise form; winning vs outbid shows in the bar CTA's status tag and the live clearing note.
    return (
      <BidRow
        clearingPriceUsd={clearingPriceUsd}
        prevBid={myBid}
        onBid={onBid}
        walletButton={walletButton}
      />
    )
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="min-w-0 flex-1">
        <GateContent journey={journey} onConnectSonar={onConnectSonar} />
      </div>
      {walletButton}
    </div>
  )
}

function GateContent({
  journey,
  onConnectSonar,
}: {
  journey: JourneyState
  onConnectSonar?: () => void
}) {
  switch (journey) {
    case "wrong-network":
      return <SwitchNetworkGate />
    case "kyc-required":
      return (
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
          icon="clock"
          title="Verification in progress"
          body="We will let you know as soon as Sonar has reviewed it."
        />
      )
    case "kyc-failed":
      return (
        <GateRow
          icon="shield-check"
          tone="danger"
          title="Verification did not pass"
          body="Contact support if you believe this is an error."
          cta="Contact support"
        />
      )
    case "not-eligible":
      return (
        <GateRow
          icon="shield-check"
          tone="danger"
          title="Not eligible"
          body="This sale is not available in your region."
        />
      )
    default:
      return <ConnectChoices />
  }
}

/** Single-row gate: icon + message on the left, optional action on the right. */
function GateRow({
  icon,
  title,
  body,
  cta,
  onCta,
  tone = "default",
}: {
  icon: string
  title: string
  body: string
  cta?: string
  onCta?: () => void
  tone?: "default" | "danger"
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon
          name={icon}
          draw={false}
          className={`h-5 w-5 shrink-0 ${tone === "danger" ? "text-danger" : "text-foreground"}`}
        />
        <p className="text-sm">
          <span className="font-medium text-foreground">{title}.</span>{" "}
          <span className="text-muted">{body}</span>
        </p>
      </div>
      {cta ? (
        <button type="button" onClick={onCta} className={PILL}>
          <span className="inline-flex items-center gap-2">{cta}</span>
        </button>
      ) : null}
    </div>
  )
}

/** Inline wallet picker for the disconnected gate. Extension wallets connect via
 * their own extension prompt; WalletConnect opens its native QR modal (the single
 * intentional popup). No app-level modal. */
function ConnectChoices() {
  const { connectors, connect, isPending, variables, error } = useConnect()
  const pendingUid =
    variables?.connector && "uid" in variables.connector ? variables.connector.uid : undefined
  // Dedupe by name: EIP-6963 discovery can surface the same wallet more than once.
  const seen = new Set<string>()
  const uniqueConnectors = connectors.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon name="wallet" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
        <p className="text-sm">
          <span className="font-medium text-foreground">Connect your wallet.</span>{" "}
          <span className={error ? "text-danger" : "text-muted"}>
            {error ? "Connection failed. Try again." : "Check your eligibility and place a bid."}
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

/** Inline wrong-network gate: switches to the sale chain via wagmi (no popup). */
function SwitchNetworkGate() {
  const { switchChain, isPending, error } = useSwitchChain()
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon name="network" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
        <p className="text-sm">
          <span className="font-medium text-foreground">Wrong network.</span>{" "}
          <span className={error ? "text-danger" : "text-muted"}>
            {error
              ? "Could not switch. Try again."
              : "This sale runs on Base. Switch your wallet to continue."}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => switchChain({ chainId: PRIMARY_CHAIN_ID })}
        disabled={isPending}
        className={PILL}
      >
        {isPending ? "Switching..." : "Switch to Base"}
      </button>
    </div>
  )
}

// Maps a reverted bid reason (Sonar pre-purchase failures + the client's own) to a
// short message shown under the bid form; an unrecognized reason falls back to the
// generic message rather than surfacing a raw upstream string. Placeholder copy,
// pending final wording.
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
}: {
  clearingPriceUsd: number | null
  prevBid?: MyBid
  onBid?: (p: BidParams) => Promise<BidResult>
  walletButton?: ReactNode
}) {
  const minPrice = SALE_ECONOMICS.startingPriceUsd
  const suggested = Math.max(clearingPriceUsd ?? minPrice, prevBid?.priceUsd ?? 0, minPrice)
  const [price, setPrice] = useState(String(suggested))
  // Raises start from the current committed amount so the CTA is active; first bids start empty.
  const [amount, setAmount] = useState(prevBid ? String(prevBid.committedUsd) : "")
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted">("idle")
  const [submitError, setSubmitError] = useState<string | null>(null)

  const priceNum = Number(price)
  const amountNum = Number(amount)
  const priceCheck = validateBidPrice(priceNum, {
    minPriceUsd: minPrice,
    prevPriceUsd: prevBid?.priceUsd,
  })
  const amountCheck = validateBidAmount(
    amountNum,
    SALE_ECONOMICS.minCommitmentUsd,
    SALE_ECONOMICS.maxCommitmentUsd,
  )
  const priceShown = price !== "" && !Number.isNaN(priceNum)
  const amountShown = amount !== "" && !Number.isNaN(amountNum)
  const priceValid = priceShown && priceCheck === "ok"
  const amountValid = amountShown && amountCheck === "ok"
  const canSubmit = priceValid && amountValid && submitState === "idle"
  const est = gnotEstimate(amountValid ? amountNum : 0, clearingPriceUsd ?? minPrice)

  const error =
    priceShown && priceCheck === "below-min"
      ? `Min price ${fmtPrice(minPrice)}.`
      : priceShown && priceCheck === "below-previous" && prevBid
        ? `Raise above your current ${fmtPrice(prevBid.priceUsd)}.`
        : amountShown && amountCheck === "too-low"
          ? `Min ${fmtUsd(SALE_ECONOMICS.minCommitmentUsd)}.`
          : amountShown && amountCheck === "too-high"
            ? `Max ${fmtUsd(SALE_ECONOMICS.maxCommitmentUsd)}.`
            : null

  // Live status vs the (last-polled) clearing price so the user knows BEFORE
  // submitting whether the bid is winning or outbid. The clearing price moves
  // (only up), so this is a best estimate on the latest poll, confirmed at submit.
  const clearingNote =
    priceValid && clearingPriceUsd != null
      ? priceNum < clearingPriceUsd
        ? {
            tone: "warn" as const,
            text: `This price would be outbid (below ${fmtPrice(clearingPriceUsd)}).`,
          }
        : {
            tone: "ok" as const,
            text: `This price would be winning (clears ${fmtPrice(clearingPriceUsd)}).`,
          }
      : null

  async function onSubmit() {
    setSubmitState("submitting")
    setSubmitError(null)
    // TODO(real-data): lockup is hardcoded false - expose a real lockup choice in the form.
    const params: BidParams = { priceUsd: priceNum, amountUsd: amountNum, lockup: false }
    if (onBid) {
      // Real flow: pre-purchase + permit (Sonar), then the on-chain seam.
      const result = await onBid(params)
      if (result.status === "submitted") {
        setSubmitState("submitted")
      } else {
        // Surface the reason instead of silently resetting to idle.
        setSubmitState("idle")
        setSubmitError(reasonToMessage(result.reason))
      }
      return
    }
    // /dev/states preview (no real actions): the module mock simulates the tx.
    const pre = await submitter.preflight(params)
    if (!pre.ok) {
      setSubmitState("idle")
      return
    }
    await submitter.submit(params)
    setSubmitState("submitted")
  }

  if (submitState === "submitted") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Icon name="shield-check" draw={false} className="h-5 w-5 shrink-0 text-mint" />
          <p className="text-sm text-foreground">
            Bid submitted - {fmtUsd(amountNum)} at {fmtPrice(priceNum)} / GNOT.
          </p>
          <button
            type="button"
            onClick={() => setSubmitState("idle")}
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Raise your bid
          </button>
        </div>
        {walletButton}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <InputCell
          id="bid-price"
          label="Max price"
          value={price}
          onChange={setPrice}
          invalid={priceShown && priceCheck !== "ok"}
          hint="The highest price you'll pay per GNOT. You win if it's at or above the final clearing price, and you pay the clearing price - not your max. Can only be raised, never lowered."
          className="w-28"
        />
        <InputCell
          id="bid-amount"
          label="Amount (USDC)"
          value={amount}
          onChange={setAmount}
          invalid={amountShown && amountCheck !== "ok"}
          placeholder={String(SALE_ECONOMICS.minCommitmentUsd)}
          hint={`How much USDC you commit. It sets your allocation: GNOT received = your amount divided by the clearing price. Min ${fmtUsd(SALE_ECONOMICS.minCommitmentUsd)}, max ${fmtUsd(SALE_ECONOMICS.maxCommitmentUsd)}.`}
          className="w-32"
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">You receive</span>
          <div className="flex items-center gap-2 py-2">
            <GnotCoin className="h-6 w-6 text-muted" />
            <span className="font-mono text-lg tabular-nums text-foreground">
              ~{fmtGnot(est)} <span className="text-muted">GNOT</span>
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-end gap-4">
          <button type="button" onClick={onSubmit} disabled={!canSubmit} className={PILL}>
            <span className="inline-flex items-center gap-2">
              {submitState === "submitting" ? "Signing..." : prevBid ? "Raise bid" : "Place bid"}
            </span>
          </button>
          {walletButton}
        </div>
      </div>
      {(error ?? submitError) ? (
        <p className="text-xs font-medium text-danger">{error ?? submitError}</p>
      ) : clearingNote ? (
        <p
          className={`text-xs ${
            clearingNote.tone === "warn" ? "font-medium text-amber" : "text-muted"
          }`}
        >
          {clearingNote.text}
        </p>
      ) : null}
    </div>
  )
}

/** Keep only decimal characters (one dot); blocks hex/scientific/whitespace in money inputs. */
function sanitizeDecimal(v: string): string {
  const cleaned = v.replace(/[^0-9.]/g, "")
  const [head, ...rest] = cleaned.split(".")
  return rest.length > 0 ? `${head}.${rest.join("")}` : head
}

function InputCell({
  id,
  label,
  value,
  onChange,
  invalid,
  placeholder,
  hint,
  className = "",
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  invalid: boolean
  placeholder?: string
  hint?: string
  className?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-[10px] uppercase tracking-[0.2em] text-muted">
          {label}
        </label>
        {hint ? <FieldHint text={hint} /> : null}
      </div>
      <div
        className={`flex items-center rounded-[var(--radius-md)] border bg-surface-alt px-3.5 py-2.5 transition-colors ${
          invalid ? "border-danger" : "border-border focus-within:border-faint"
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(sanitizeDecimal(e.target.value))}
          aria-invalid={invalid || undefined}
          className={`${className} bg-transparent font-mono text-lg tabular-nums text-foreground outline-none`}
        />
      </div>
    </div>
  )
}

/** A "?" next to a field label; reveals its hint on focus only (not hover), so just one
 * is ever open and a click elsewhere blurs it shut. Opens downward to stay inside the
 * bid panel's scroll container. The button's aria-label carries the text for assistive
 * tech. */
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
        className="pointer-events-none absolute left-0 top-full z-[var(--z-modal)] mt-2 w-max max-w-[22rem] rounded-[var(--radius-md)] bg-on-contrast px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-surface-contrast opacity-0 shadow-lg transition-opacity duration-100 group-focus-within/hint:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}
