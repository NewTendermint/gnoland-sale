import { notFound } from "next/navigation"
// Dev-only state harness: renders the sticky bar in every state. Gated out of production.
import type { ReactNode } from "react"
import { AwarenessBarBody } from "../../(layout)/BidPanelAwareness"
import { BidSectionHeader, PreSaleRight } from "../../(layout)/BidPanelDesktop"
import { BidFlow, type BidPreview } from "../../(sections)/bid/BidFlow"
import { BidStatusTag, FunnelSteps } from "../../(sections)/bid/FunnelSteps"
import { Cta } from "../../(ui)/Cta"
import { Icon } from "../../(ui)/Icon"
import { fmtCompactUsd, fmtCount, fmtPrice } from "../../../lib/sale/format"
import { bidCtaLabel } from "../../../lib/sale/labels"
import { MOCK_COMMITMENT_LIVE, MOCK_JOURNEY_INPUTS } from "../../../lib/sale/mock"
import { stateOverridesEnabled } from "../../../lib/sale/overrides"
import type { JourneyState, PreSaleBarState } from "../../../lib/sale/types"

const METRICS = [
  {
    icon: "clearing",
    value: MOCK_COMMITMENT_LIVE.clearingPriceUsd
      ? fmtPrice(MOCK_COMMITMENT_LIVE.clearingPriceUsd)
      : "TBD",
    label: "Clearing",
  },
  { icon: "clock", value: "5d 12:30:00", label: "Time left" },
  {
    icon: "users-group",
    value: fmtCount(MOCK_COMMITMENT_LIVE.uniqueCommitmentCount),
    label: "Bidders",
  },
  {
    icon: "database",
    value: fmtCompactUsd(MOCK_COMMITMENT_LIVE.totalCommittedUsd),
    label: "Committed",
  },
]

function CtaPill({ journey }: { journey: JourneyState }) {
  return (
    <Cta variant="solid" arrow>
      <BidStatusTag journey={journey} />
      {bidCtaLabel(journey)}
    </Cta>
  )
}

function MetricsRow({
  dense,
  right,
}: {
  dense: boolean
  right: ReactNode
}) {
  return (
    <div className="border-t border-border py-4 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div
          className={`flex flex-wrap items-center ${
            dense ? "gap-x-5 gap-y-2 sm:gap-x-7" : "gap-8 sm:gap-10"
          }`}
        >
          {METRICS.map((m, i) => (
            <div
              key={m.label}
              className={`flex items-center ${dense ? "gap-x-5 sm:gap-x-7" : "gap-8 sm:gap-10"}`}
            >
              {i > 0 ? (
                <div aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />
              ) : null}
              <div>
                <div className="flex items-center gap-2">
                  <Icon name={m.icon} className="h-[18px] w-[18px]" />
                  <p
                    className={`font-mono font-medium tracking-tight tabular-nums ${
                      dense ? "text-lg" : "text-2xl"
                    }`}
                  >
                    {m.value}
                  </p>
                </div>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
                  {m.label}
                </p>
              </div>
            </div>
          ))}
        </div>
        {right}
      </div>
    </div>
  )
}

function CollapsedBar({ journey }: { journey: JourneyState }) {
  return (
    <div className="rounded-[var(--frame-radius)] border border-border bg-background px-6 lg:px-8">
      <MetricsRow dense={false} right={<CtaPill journey={journey} />} />
    </div>
  )
}

// Journey states where a wallet is connected (the bid-panel header strip shows).
const WALLET_CONNECTED_STATES: JourneyState[] = [
  "ready",
  "wrong-network",
  "has-bid-winning",
  "has-bid-outbid",
]

// Static stand-in for the live WalletButton (the gallery has no wagmi connection).
function MockWalletChip() {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-full border border-border px-3 font-mono text-[11px] text-foreground">
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-foreground" />
      0x2074…491f
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-3.5 w-3.5 text-muted"
        aria-hidden="true"
      >
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
    </span>
  )
}

function ExpandedBar({
  journey,
  returning = false,
  preview,
}: { journey: JourneyState; returning?: boolean; preview?: BidPreview }) {
  const input = MOCK_JOURNEY_INPUTS[journey]
  return (
    <div className="overflow-hidden rounded-[var(--frame-radius)] border border-border bg-background">
      <div className="px-6 lg:px-8">
        <MetricsRow dense={true} right={<FunnelSteps journey={journey} />} />
      </div>
      <div className="px-6 py-6 lg:px-8">
        <div className="bid-capsule px-6 py-5">
          {WALLET_CONNECTED_STATES.includes(journey) ? (
            <BidSectionHeader
              journey={journey}
              myBid={input.myBid}
              clearingPriceUsd={input.clearingPriceUsd}
              wallet={<MockWalletChip />}
            />
          ) : null}
          <BidFlow
            journey={journey}
            returning={returning}
            clearingPriceUsd={input.clearingPriceUsd}
            myBid={input.myBid}
            preview={preview}
          />
        </div>
      </div>
    </div>
  )
}

function CompactPreview({
  lead,
  headline,
  sub,
  cta,
}: {
  lead: string
  headline: string
  sub: string
  cta: string
}) {
  return (
    <div className="rounded-[var(--frame-radius)] border border-border bg-background">
      <div className="px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border py-4 sm:py-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{lead}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{headline}</p>
            <p className="mt-1 text-sm text-muted">{sub}</p>
          </div>
          <Cta variant="solid" arrow>
            {cta}
          </Cta>
        </div>
      </div>
    </div>
  )
}

function Caption({ children }: { children: string }) {
  return <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-faint">{children}</p>
}

// One framed view: title + an optional "see it live" URL, separated by an hr-like top border.
function GallerySection({
  title,
  href,
  children,
}: {
  title: string
  href?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-foreground">
          {title}
        </p>
        {href ? (
          <a
            href={href}
            className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
          >
            see it live <code className="font-mono">{href}</code>
          </a>
        ) : null}
      </div>
      {children}
    </section>
  )
}

// The REAL pre-sale bar (PreSaleRight) inside a bar-like shell, for the gallery.
function PreSaleBarPreview({
  state,
  returning = false,
}: { state: PreSaleBarState; returning?: boolean }) {
  return (
    <div className="rounded-[var(--frame-radius)] border border-border bg-background px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-border py-4 sm:py-6">
        <div>
          <p className="font-mono text-2xl font-medium tabular-nums tracking-tight">28d 14:00:00</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
            Opens July 20, 2026
          </p>
        </div>
        <PreSaleRight state={state} returning={returning} />
      </div>
    </div>
  )
}

const PRE_SALE_BAR_STATES: ReadonlyArray<{
  label: string
  state: PreSaleBarState
  returning: boolean
  href: string
}> = [
  {
    label: "Notify (stage A, registration closed)",
    state: "notify",
    returning: false,
    href: "/?phase=pre-sale&registration=closed&journey=kyc-required",
  },
  {
    label: "Register (new visitor)",
    state: "register",
    returning: false,
    href: "/?phase=pre-sale&registration=open&journey=kyc-required",
  },
  {
    label: "Register - returning (Welcome back / Reconnect)",
    state: "register",
    returning: true,
    href: "/?phase=pre-sale&registration=open&journey=kyc-required",
  },
  {
    label: "Pending (in review)",
    state: "pending",
    returning: false,
    href: "/?phase=pre-sale&registration=open&journey=kyc-pending",
  },
  {
    label: "Failed (Contact support + shield-x)",
    state: "failed",
    returning: false,
    href: "/?phase=pre-sale&registration=open&journey=kyc-failed",
  },
  {
    label: "Not eligible (shield-x)",
    state: "not-eligible",
    returning: false,
    href: "/?phase=pre-sale&registration=open&journey=not-eligible",
  },
  {
    label: "Registered (Identity verified)",
    state: "registered",
    returning: false,
    href: "/?phase=pre-sale&registration=open&journey=disconnected",
  },
  {
    label: "Auth error",
    state: "auth-error",
    returning: false,
    href: "/?phase=pre-sale&auth=error&journey=kyc-required",
  },
]

// Money-loop sub-states. Reachable live by clicking "Place bid"; shown here as static snapshots
// so every step is reviewable without driving the transient flow.
const MONEY_LOOP: ReadonlyArray<{ label: string; journey: JourneyState; preview: BidPreview }> = [
  {
    label: "Confirm - binding review",
    journey: "ready",
    preview: { state: "confirming", amountUsd: 1000 },
  },
  { label: "Approving USDC", journey: "ready", preview: { state: "approving", amountUsd: 1000 } },
  { label: "Signing the bid", journey: "ready", preview: { state: "signing", amountUsd: 1000 } },
  {
    label: "Submitted (receipt + View transaction)",
    journey: "ready",
    preview: { state: "submitted", amountUsd: 1000, txHash: `0x${"a1b2c3d4".repeat(8)}` },
  },
  {
    label: "Submit failed (technical issue)",
    journey: "ready",
    preview: {
      state: "idle",
      amountUsd: 1000,
      error: "Could not place your bid. Please try again.",
    },
  },
  {
    label: "Raise - adds USDC (only the delta is charged)",
    journey: "has-bid-winning",
    preview: { state: "confirming", amountUsd: 5000 },
  },
  {
    label: "Raise - same amount (no extra USDC, just sign)",
    journey: "has-bid-winning",
    preview: { state: "confirming", amountUsd: 3200 },
  },
]

export default function DevStatesPage() {
  if (!stateOverridesEnabled()) notFound()

  const states = Object.keys(MOCK_JOURNEY_INPUTS) as JourneyState[]

  return (
    <main className="page-container py-10">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Dev harness</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Sticky bar - every state, collapsed + expanded
        </h1>
        <p className="mt-1 text-sm text-muted">
          For each state: the collapsed bar (metrics + opening CTA) then the expanded bar (metrics +
          stepper on top, flow below). Drive the real bar with{" "}
          <code className="font-mono">?journey=&lt;state&gt;</code> /{" "}
          <code className="font-mono">?phase=pre-sale|ended</code>.
        </p>
      </header>

      <div className="flex flex-col gap-14">
        {PRE_SALE_BAR_STATES.map((row) => (
          <GallerySection key={row.label} title={`Pre-sale · ${row.label}`} href={row.href}>
            <PreSaleBarPreview state={row.state} returning={row.returning} />
          </GallerySection>
        ))}

        {states.map((s) => (
          <GallerySection key={s} title={`Live · ${s}`} href={`/?journey=${s}`}>
            <Caption>Collapsed</Caption>
            <CollapsedBar journey={s} />
            <Caption>Expanded</Caption>
            <ExpandedBar journey={s} />
          </GallerySection>
        ))}

        <GallerySection
          title="Live · kyc-required (returning -> Welcome back)"
          href="/?journey=kyc-required"
        >
          <Caption>Expanded</Caption>
          <ExpandedBar journey="kyc-required" returning />
        </GallerySection>

        <GallerySection
          title="Live · money-loop (commit -> approve -> sign -> receipt)"
          href="/?journey=ready"
        >
          <p className="text-sm text-muted">
            Live, this runs on click (Place bid). Approve/sign are dev-paced previews - in
            production the wallet drives the timing and the on-chain seam returns the real tx hash.
          </p>
          {MONEY_LOOP.map((m) => (
            <div key={m.label} className="flex flex-col gap-1.5">
              <Caption>{m.label}</Caption>
              <ExpandedBar journey={m.journey} preview={m.preview} />
            </div>
          ))}
        </GallerySection>

        <GallerySection title="Ended · collapsed (metrics + View results)">
          <CompactPreview
            lead="Public sale"
            headline="Ended"
            sub="Final price $0.1161"
            cta="View results"
          />
          <div className="flex flex-col gap-1.5">
            <a
              href="/?phase=ended&journey=has-bid-winning"
              className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              won - expand, connect, allocation{" "}
              <code className="font-mono">{"/?phase=ended&journey=has-bid-winning"}</code>
            </a>
            <a
              href="/?phase=ended&journey=has-bid-outbid"
              className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              outbid - expand, connect, claim{" "}
              <code className="font-mono">{"/?phase=ended&journey=has-bid-outbid"}</code>
            </a>
          </div>
        </GallerySection>

        <GallerySection title="Awareness bar (touch / < lg) - read-only, per phase">
          {(
            [
              ["pre-sale / notify (stage A)", "pre-sale", "registration-closed"],
              ["pre-sale / registration open (stage B)", "pre-sale", "registration-open"],
              ["live", "live", "registration-closed"],
              ["ended", "ended", "registration-closed"],
            ] as const
          ).map(([label, phase, stage]) => (
            <div key={label} className="flex flex-col gap-3">
              <Caption>{label}</Caption>
              <div className="rounded-[var(--frame-radius)] border border-border bg-background px-6 lg:px-8">
                <div className="border-t border-border">
                  <AwarenessBarBody
                    phase={phase}
                    preSaleStage={stage}
                    commitment={MOCK_COMMITMENT_LIVE}
                  />
                </div>
              </div>
            </div>
          ))}
        </GallerySection>
      </div>
    </main>
  )
}
