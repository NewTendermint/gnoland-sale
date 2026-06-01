"use client"

/**
 * Presentational bid funnel shown inside the expanded sticky bar. A funnel
 * stepper (Connect -> Verify -> Bid) sits on top so the user always sees where
 * they are; the per-state content sits below. The bid form uses real boxed
 * input fields (price / amount) with a label above + a read-only "you receive"
 * box. Pure: takes (journey, clearingPriceUsd, myBid) so /dev/states renders
 * every state without a wallet or Sonar. On-chain goes through MockBidSubmitter;
 * the real wagmi replaceBidWithPermit impl (ABI source-verified, REQUIREMENTS
 * A.12.1) drops in behind the same interface.
 *
 * NOTE (copy): every visitor-facing string here is NEW placeholder microcopy,
 * to be validated/owned by the team. Flagged in the session report.
 */
import { useState } from "react"
import { Icon } from "../../(ui)/Icon"
import { gnotEstimate, validateBidAmount, validateBidPrice } from "../../../lib/sale/calc"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"
import { MockBidSubmitter } from "../../../lib/sale/submitter"
import type { JourneyState, MyBid } from "../../../lib/sale/types"

const submitter = new MockBidSubmitter()

const PILL =
  "inline-flex items-center gap-2 rounded-full bg-surface-contrast px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast transition-colors hover:bg-surface-contrast/80 disabled:cursor-not-allowed disabled:opacity-40"

const fmtPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
const fmtUsd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
const fmtGnot = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 })

const FUNNEL: { label: string; states: JourneyState[] }[] = [
  { label: "Connect", states: ["disconnected", "wrong-network"] },
  { label: "Verify", states: ["kyc-required", "kyc-pending", "kyc-failed", "not-eligible"] },
  { label: "Bid", states: ["ready", "has-bid-winning", "has-bid-outbid"] },
]

export function BidFlow({
  journey,
  clearingPriceUsd,
  myBid,
}: {
  journey: JourneyState
  clearingPriceUsd: number | null
  myBid: MyBid
}) {
  // Content only. The funnel stepper is rendered by the bar's top (metrics) row.
  return <StateContent journey={journey} clearingPriceUsd={clearingPriceUsd} myBid={myBid} />
}

function StateContent({
  journey,
  clearingPriceUsd,
  myBid,
}: {
  journey: JourneyState
  clearingPriceUsd: number | null
  myBid: MyBid
}) {
  switch (journey) {
    case "disconnected":
      return (
        <GateRow
          icon="wallet"
          title="Connect your wallet"
          body="Check your eligibility and place a bid."
          cta="Connect wallet"
        />
      )
    case "wrong-network":
      return (
        <GateRow
          icon="network"
          title="Wrong network"
          body="This sale runs on Base. Switch your wallet to continue."
          cta="Switch to Base"
        />
      )
    case "kyc-required":
      return (
        <GateRow
          icon="shield-check"
          title="Verify your identity"
          body="One-time verification with Sonar, about 3 minutes."
          cta="Verify with Sonar"
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
    case "ready":
      return <BidRow clearingPriceUsd={clearingPriceUsd} />
    case "has-bid-winning":
    case "has-bid-outbid":
      // Both are a raise form; the winning/outbid status shows in the top metrics row (BidStatus).
      return <BidRow clearingPriceUsd={clearingPriceUsd} prevBid={myBid} />
  }
}

/** Funnel position: Connect -> Verify -> Bid, current step highlighted.
 * Rendered in the bar's top (metrics) row, right side, when expanded. */
export function FunnelSteps({ journey }: { journey: JourneyState }) {
  const current = FUNNEL.findIndex((s) => s.states.includes(journey))
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {FUNNEL.map((step, i) => {
        const phase = i < current ? "done" : i === current ? "current" : "upcoming"
        return (
          <li key={step.label} className="flex items-center gap-3">
            {i > 0 ? (
              <span className={`h-px w-6 ${i <= current ? "bg-foreground" : "bg-border"}`} />
            ) : null}
            <span className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium tabular-nums ${
                  phase === "current"
                    ? "border-foreground bg-foreground text-background"
                    : phase === "done"
                      ? "border-foreground text-foreground"
                      : "border-border text-faint"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
                  phase === "upcoming" ? "text-faint" : "text-foreground"
                }`}
              >
                {step.label}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Single-row gate: icon + message on the left, optional action on the right. */
function GateRow({
  icon,
  title,
  body,
  cta,
  tone = "default",
}: {
  icon: string
  title: string
  body: string
  cta?: string
  tone?: "default" | "danger"
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Icon
          name={icon}
          className={`h-5 w-5 shrink-0 ${tone === "danger" ? "text-danger" : "text-foreground"}`}
        />
        <p className="text-sm">
          <span className="font-medium text-foreground">{title}.</span>{" "}
          <span className="text-muted">{body}</span>
        </p>
      </div>
      {cta ? (
        <button type="button" className={PILL}>
          {cta}
        </button>
      ) : null}
    </div>
  )
}

function BidRow({
  clearingPriceUsd,
  prevBid,
}: {
  clearingPriceUsd: number | null
  prevBid?: MyBid
}) {
  const minPrice = SALE_ECONOMICS.startingPriceUsd
  const suggested = Math.max(clearingPriceUsd ?? minPrice, prevBid?.priceUsd ?? 0, minPrice)
  const [price, setPrice] = useState(String(suggested))
  // Raises start from the current committed amount so the CTA is active; first bids start empty.
  const [amount, setAmount] = useState(prevBid ? String(prevBid.committedUsd) : "")
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted">("idle")

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

  async function onSubmit() {
    setSubmitState("submitting")
    const params = { priceUsd: priceNum, amountUsd: amountNum, lockup: false }
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
      <div className="flex flex-wrap items-center gap-3">
        <Icon name="shield-check" className="h-5 w-5 shrink-0 text-mint" />
        <p className="text-sm text-foreground">
          Bid submitted - {fmtUsd(amountNum)} at {fmtPrice(priceNum)} / GNOT.
        </p>
        <button
          type="button"
          onClick={() => setSubmitState("idle")}
          className="text-xs font-bold uppercase tracking-[0.2em] text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          Place another
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <InputCell
        id="bid-price"
        label="Max price"
        icon="clearing"
        value={price}
        onChange={setPrice}
        invalid={priceShown && priceCheck !== "ok"}
        className="w-24"
      />
      <InputCell
        id="bid-amount"
        label="Amount (USDC)"
        icon="database"
        value={amount}
        onChange={setAmount}
        invalid={amountShown && amountCheck !== "ok"}
        placeholder={String(SALE_ECONOMICS.minCommitmentUsd)}
        className="w-28"
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">You receive</span>
        <div className="flex items-center gap-2 py-2">
          <Icon name="cube" className="h-[18px] w-[18px] shrink-0 text-muted" />
          <span className="font-mono text-lg tabular-nums text-foreground">
            ~{fmtGnot(est)} <span className="text-muted">GNOT</span>
          </span>
        </div>
      </div>

      <div className="ml-auto flex h-[42px] items-center gap-4">
        {error ? <span className="max-w-[14rem] text-xs text-danger">{error}</span> : null}
        <button type="button" onClick={onSubmit} disabled={!canSubmit} className={PILL}>
          {submitState === "submitting" ? "Signing..." : prevBid ? "Raise bid" : "Place bid"}
        </button>
      </div>
    </div>
  )
}

/** Bid status chip for the top metrics row. Winning = bid clears (in allocation);
 * Outbid = below the clearing price. Replaces the old full-width banner so the
 * form stays a single line. The off-page outbid alert (email / Base app push)
 * is the deferred re-engagement channel (REQUIREMENTS A.13.2). */
export function BidStatus({ journey }: { journey: JourneyState }) {
  if (journey === "has-bid-winning") {
    return (
      <span className="rounded-full bg-mint-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-mint">
        Winning
      </span>
    )
  }
  if (journey === "has-bid-outbid") {
    return (
      <span className="rounded-full border border-amber px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber">
        Outbid
      </span>
    )
  }
  return null
}

function InputCell({
  id,
  label,
  value,
  onChange,
  invalid,
  placeholder,
  icon,
  className = "",
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  invalid: boolean
  placeholder?: string
  icon: string
  className?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 rounded-[var(--radius-md)] border bg-surface-alt px-3 py-2 transition-colors ${
          invalid ? "border-danger" : "border-border focus-within:border-border-strong"
        }`}
      >
        <Icon name={icon} className="h-[18px] w-[18px] shrink-0 text-muted" />
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          className={`${className} bg-transparent font-mono text-lg tabular-nums text-foreground outline-none`}
        />
      </div>
    </div>
  )
}
