import { notFound } from "next/navigation"
// Dev-only state harness: renders the sticky bar in every state. Gated out of production.
import { Fragment, type ReactNode } from "react"
import { MetricPendingChip } from "../../(layout)/BidBarShell"
import { BidSectionHeader, PreSaleRight } from "../../(layout)/BidPanelDesktop"
import { BidFlow, type BidPreview, PostBidOptIns } from "../../(sections)/bid/BidFlow"
import { BidStatusTag, FunnelSteps } from "../../(sections)/bid/FunnelSteps"
import { SettlementFlow } from "../../(sections)/bid/SettlementFlow"
import { Cta } from "../../(ui)/Cta"
import { Icon } from "../../(ui)/Icon"
import { fmtCompactUsd, fmtCount, fmtPrice, pendingCommittedChip } from "../../../lib/sale/format"
import { bidCtaLabel } from "../../../lib/sale/labels"
import { MOCK_COMMITMENT_LIVE, MOCK_JOURNEY_INPUTS } from "../../../lib/sale/mock"
import type { ClaimGate } from "../../../lib/sale/onchain"
import { stateOverridesEnabled } from "../../../lib/sale/overrides"
import { sonarSetupUrl } from "../../../lib/sale/setup-url"
import type { JourneyState, MyBid, PreSaleBarState } from "../../../lib/sale/types"

type PreviewMetric = { icon: string; value: string; label: string; pending?: string }

const METRICS: PreviewMetric[] = [
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

// Mirrors liveMetrics with a PendingBidDelta ($500). Chip copy comes from the same format
// helper as production, so the gallery cannot drift. Committed only: it is the last metric,
// so the inline chip never shifts a neighbour when it appears or vanishes.
const METRICS_PENDING: PreviewMetric[] = METRICS.map((m) =>
  m.label === "Committed" ? { ...m, pending: pendingCommittedChip(500) } : m,
)

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
  metrics = METRICS,
}: {
  dense: boolean
  right: ReactNode
  metrics?: PreviewMetric[]
}) {
  return (
    <div className="border-t border-border py-4 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div
          className={`flex flex-wrap items-start ${
            dense ? "gap-x-5 gap-y-2 sm:gap-x-7" : "gap-5 xl:gap-7"
          }`}
        >
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`flex items-start ${dense ? "gap-x-5 sm:gap-x-7" : "gap-5 xl:gap-7"}`}
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
                  {m.pending ? <MetricPendingChip label={m.pending} /> : null}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="ml-auto flex justify-end">{right}</div>
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
      <Icon name="wallet" draw={false} className="h-3.5 w-3.5 shrink-0" />
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

// Stand-in for the env-derived Echo setup URL (page.tsx wires the real one into SaleProvider).
const SETUP_URL_PREVIEW = sonarSetupUrl("00000000-0000-0000-0000-000000000000")

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
              manageEntitiesHref={SETUP_URL_PREVIEW}
              entityLabel="Jane Cooper Ltd"
            />
          ) : null}
          <BidFlow
            journey={journey}
            returning={returning}
            clearingPriceUsd={input.clearingPriceUsd}
            myBid={input.myBid}
            setupHref={SETUP_URL_PREVIEW}
            entityLabel="Jane Cooper Ltd"
            preview={preview}
          />
        </div>
      </div>
    </div>
  )
}

// Mirrors the real ended collapsed bar (BidPanelDesktop, phase === "ended"): Ended pill +
// finalMetrics + View results. Values come from the same format helpers as production, and the
// cell markup mirrors MetricCell (BidBarShell), so the gallery cannot drift. Built inline (not by
// calling finalMetrics) because this is a Server Component and finalMetrics lives in a client module.
const ENDED_METRICS: PreviewMetric[] = [
  {
    icon: "clearing",
    value: fmtPrice(MOCK_COMMITMENT_LIVE.clearingPriceUsd ?? 0),
    label: "Final price",
  },
  {
    icon: "database",
    value: fmtCompactUsd(MOCK_COMMITMENT_LIVE.totalCommittedUsd),
    label: "Raised",
  },
  {
    icon: "users-group",
    value: fmtCount(MOCK_COMMITMENT_LIVE.uniqueCommitmentCount),
    label: "Bidders",
  },
]

function EndedBarPreview() {
  return (
    <div className="rounded-[var(--frame-radius)] border border-border bg-background px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-border py-4 sm:py-6">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:gap-x-9">
          <span className="status-pill">Ended</span>
          {ENDED_METRICS.map((m) => (
            <div key={m.label}>
              <div className="flex items-center gap-2">
                <Icon name={m.icon} className="h-[18px] w-[18px]" />
                <p className="font-mono text-lg font-medium tracking-tight tabular-nums">
                  {m.value}
                </p>
              </div>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">{m.label}</p>
            </div>
          ))}
        </div>
        <Cta variant="solid" arrow className="ml-auto">
          <span>View results</span>
        </Cta>
      </div>
    </div>
  )
}

function Caption({ children }: { children: string }) {
  return <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-faint">{children}</p>
}

function GallerySection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-8">
      <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-foreground">
        {title}
      </p>
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
        <PreSaleRight
          state={state}
          returning={returning}
          setupHref={SETUP_URL_PREVIEW}
          entityLabel="Jane Cooper Ltd"
        />
      </div>
    </div>
  )
}

const PRE_SALE_BAR_STATES: ReadonlyArray<{
  label: string
  state: PreSaleBarState
  returning: boolean
}> = [
  {
    label: "Notify (stage A, registration closed)",
    state: "notify",
    returning: false,
  },
  {
    label: "Register (new visitor)",
    state: "register",
    returning: false,
  },
  {
    label: "Register - returning (Welcome back / Reconnect)",
    state: "register",
    returning: true,
  },
  {
    label: "Incomplete (setup unfinished -> Complete on Sonar)",
    state: "incomplete",
    returning: false,
  },
  {
    label: "Pending (in review)",
    state: "pending",
    returning: false,
  },
  {
    label: "Failed (Contact support + shield-x)",
    state: "failed",
    returning: false,
  },
  {
    label: "Not eligible (shield-x)",
    state: "not-eligible",
    returning: false,
  },
  {
    label: "Registered (Identity verified)",
    state: "registered",
    returning: false,
  },
  {
    label: "Auth error",
    state: "auth-error",
    returning: false,
  },
]

// Money-loop sub-states: static snapshots of each bid-flow step.
const MONEY_LOOP: ReadonlyArray<{ label: string; journey: JourneyState; preview: BidPreview }> = [
  {
    label: "Confirm - binding review",
    journey: "ready",
    preview: { state: "confirming", amountUsd: 1000 },
  },
  { label: "Approving USDC", journey: "ready", preview: { state: "approving", amountUsd: 1000 } },
  { label: "Signing the bid", journey: "ready", preview: { state: "signing", amountUsd: 1000 } },
  {
    label: "Confirming on-chain (signed, waiting for the receipt)",
    journey: "ready",
    preview: { state: "pending", amountUsd: 1000 },
  },
  {
    label: "Submitted (receipt + View transaction)",
    journey: "ready",
    preview: { state: "submitted", amountUsd: 1000, txHash: `0x${"a1b2c3d4".repeat(8)}` },
  },
  {
    label: "Submitted + Raise bid (live: remounts onto the raise form)",
    journey: "has-bid-winning",
    preview: {
      state: "submitted",
      amountUsd: 5000,
      txHash: `0x${"a1b2c3d4".repeat(8)}`,
      raiseCta: true,
    },
  },
  {
    label: "Submit failed (technical issue)",
    journey: "ready",
    preview: {
      state: "idle",
      amountUsd: 1000,
      balanceUsd: 2500,
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
  {
    label: "Confirm with a liveness blocker surfaced early (advisory, links out)",
    journey: "ready",
    preview: {
      state: "confirming",
      amountUsd: 1000,
      precheck: { reason: "requires-liveness", livenessUrl: "https://verify.example.com/s/123" },
    },
  },
  {
    label: "Balance line - wallet holds $2,500, bid $1,000 (covered)",
    journey: "ready",
    preview: { state: "idle", amountUsd: 1000, balanceUsd: 2500 },
  },
  {
    label: "Balance insufficient - first bid $1,000 > $250 wallet (CTA disabled)",
    journey: "ready",
    preview: { state: "idle", amountUsd: 1000, balanceUsd: 250 },
  },
  {
    label: "Raise covered by DELTA - $5,000 bid, $2,500 wallet, only +$1,800 moves (no error)",
    journey: "has-bid-winning",
    preview: { state: "idle", amountUsd: 5000, balanceUsd: 2500 },
  },
  {
    label: "Raise delta NOT covered - +$1,800 needed, $1,500 wallet (CTA disabled)",
    journey: "has-bid-winning",
    preview: { state: "idle", amountUsd: 5000, balanceUsd: 1500 },
  },
]

// Settlement (ended phase) claim-gate states: the gate mirrors readClaimGate's on-chain read
// (stage Done + claimRefundEnabled + committed - accepted), fixtures here, real reads live.
const SETTLEMENT_STATES: ReadonlyArray<{
  label: string
  myBid: MyBid | null
  gate: ClaimGate | undefined
}> = [
  {
    label: "Empty Sonar answer, no pending entry (the no-commitment fallback)",
    myBid: null,
    gate: undefined,
  },
  {
    label: "Gate unresolved (contract read pending) - claim button hidden, fail-closed",
    myBid: MOCK_JOURNEY_INPUTS["has-bid-outbid"].myBid,
    gate: undefined,
  },
  {
    label: "Settlement still running on-chain (stage not Done) - numbers only, no claim assertion",
    myBid: MOCK_JOURNEY_INPUTS["has-bid-outbid"].myBid,
    gate: { done: false, claimEnabled: false, refunded: false, refundableUsd: null },
  },
  {
    label: "Outbid - claim open, full commitment refundable",
    myBid: MOCK_JOURNEY_INPUTS["has-bid-outbid"].myBid,
    gate: { done: true, claimEnabled: true, refunded: false, refundableUsd: 3200 },
  },
  {
    label: "Winner - pro-rata partial refund (on-chain amount overrides the derived $0)",
    myBid: MOCK_JOURNEY_INPUTS["has-bid-winning"].myBid,
    gate: { done: true, claimEnabled: true, refunded: false, refundableUsd: 480 },
  },
  {
    label: "Winner with ZERO fill (contract refunds all) - no-allocation copy, refund only",
    myBid: MOCK_JOURNEY_INPUTS["has-bid-winning"].myBid,
    gate: { done: true, claimEnabled: true, refunded: false, refundableUsd: 3200 },
  },
  {
    label: "Claim disabled on-chain - refunds processed automatically (refunder role)",
    myBid: MOCK_JOURNEY_INPUTS["has-bid-outbid"].myBid,
    gate: { done: true, claimEnabled: false, refunded: false, refundableUsd: 3200 },
  },
  {
    label: "Already refunded on-chain - Refund sent",
    myBid: MOCK_JOURNEY_INPUTS["has-bid-outbid"].myBid,
    gate: { done: true, claimEnabled: true, refunded: true, refundableUsd: 3200 },
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
          stepper on top, flow below). The live page has no URL overrides - to reproduce a state for
          real, use the Sonar sandbox entity Overrides.
        </p>
      </header>

      <div className="flex flex-col gap-14">
        {PRE_SALE_BAR_STATES.map((row) => (
          <GallerySection key={row.label} title={`Pre-sale · ${row.label}`}>
            <PreSaleBarPreview state={row.state} returning={row.returning} />
          </GallerySection>
        ))}

        {states.map((s) => (
          <Fragment key={s}>
            <GallerySection title={`Live · ${s}`}>
              <Caption>Collapsed</Caption>
              <CollapsedBar journey={s} />
              <Caption>Expanded</Caption>
              <ExpandedBar journey={s} />
            </GallerySection>

            {s === "kyc-required" ? (
              <GallerySection title="Live · kyc-required (returning -> Welcome back)">
                <Caption>Expanded</Caption>
                <ExpandedBar journey="kyc-required" returning />
              </GallerySection>
            ) : null}

            {s === "ready" ? (
              <GallerySection title="Live · money-loop (commit -> approve -> sign -> receipt)">
                <p className="text-sm text-muted">
                  Live, this runs on click (Place bid). Approve/sign are dev-paced previews - in
                  production the wallet drives the timing and the on-chain seam returns the real tx
                  hash.
                </p>
                {MONEY_LOOP.map((m) => (
                  <div key={m.label} className="flex flex-col gap-1.5">
                    <Caption>{m.label}</Caption>
                    <ExpandedBar journey={m.journey} preview={m.preview} />
                  </div>
                ))}
              </GallerySection>
            ) : null}
          </Fragment>
        ))}

        <GallerySection title="Live · pending indexing (bid confirmed on-chain, Sonar catching up)">
          <p className="text-sm text-muted">
            Right after a confirmed bid, Sonar's read trails by ~1min (readCommitmentData cache):
            the position overlays from localStorage (gnot:pending-bid) and the unreported share
            shows as chips next to the Bidders / Committed labels. Chips purge once Sonar reports
            the amount (10s poll), on sign-out, or after the 10min TTL. The journey holds a
            dedicated has-bid-pending state so no surface claims Winning/Outbid early.
          </p>
          <Caption>Collapsed - first bid, $500 not indexed yet</Caption>
          <div className="rounded-[var(--frame-radius)] border border-border bg-background px-6 lg:px-8">
            <MetricsRow
              dense={false}
              metrics={METRICS_PENDING}
              right={<CtaPill journey="has-bid-pending" />}
            />
          </div>
          <Caption>Your bid header - neutral Pending status while unreported</Caption>
          <div className="overflow-hidden rounded-[var(--frame-radius)] border border-border bg-background">
            <div className="px-6 py-6 lg:px-8">
              <div className="bid-capsule px-6 py-5">
                <BidSectionHeader
                  journey="has-bid-pending"
                  myBid={MOCK_JOURNEY_INPUTS["has-bid-pending"].myBid}
                  clearingPriceUsd={MOCK_JOURNEY_INPUTS["has-bid-pending"].clearingPriceUsd}
                  wallet={<MockWalletChip />}
                />
              </div>
            </div>
          </div>
        </GallerySection>

        <GallerySection title="Post-bid opt-ins · one line, shared explainer, push + email side by side">
          <p className="text-sm text-muted">
            The bid-panel success row: confirmation left, the REAL PostBidOptIns component right (no
            static replica, so the gallery cannot drift). Fully interactive: the email flow mocks
            Mailchimp in dev, the push flow uses this browser's real permission state.
          </p>
          <Caption>
            Submitted - single row, two compact CTAs (each opens its dedicated view in place)
          </Caption>
          <div className="overflow-hidden rounded-[var(--frame-radius)] border border-border bg-background">
            <div className="px-6 py-6 lg:px-8">
              {/* Same dark capsule as the real panel: the ghost-contrast CTAs are invisible on a
                  light background, so the preview must replicate the production surface. */}
              <div className="bid-capsule px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-3">
                  <div className="flex items-center gap-3">
                    <Icon name="shield-check" draw={false} className="h-5 w-5 shrink-0 text-mint" />
                    <p className="whitespace-nowrap text-sm text-foreground">
                      Bid submitted - $1,000 at $0.086 per GNOT.
                    </p>
                    <span className="whitespace-nowrap text-xs text-muted underline underline-offset-2">
                      View tx
                    </span>
                  </div>
                  <PostBidOptIns bidLimitUsd={0.086} />
                </div>
              </div>
            </div>
          </div>
        </GallerySection>

        <GallerySection title="Ended · collapsed (metrics + View results)">
          <EndedBarPreview />
          <p className="text-xs text-muted">
            won - expand, connect, allocation · outbid - expand, connect, claim
          </p>
        </GallerySection>

        <GallerySection title="Ended · settlement flow (on-chain claim gate)">
          <p className="text-sm text-muted">
            Live, the gate comes from readClaimGate (stage() == Done + claimRefundEnabled + the
            contract's committed - accepted refundable). The claim button is fail-closed: it only
            renders once the contract confirms the self-serve window; a claim-disabled sale shows
            the refunder-role line instead. onClaim is dev-mocked here (instant Refund sent).
          </p>
          {SETTLEMENT_STATES.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5">
              <Caption>{s.label}</Caption>
              <div className="overflow-hidden rounded-[var(--frame-radius)] border border-border bg-background">
                <div className="px-6 py-6 lg:px-8">
                  <div className="bid-capsule px-6 py-5">
                    <SettlementFlow
                      clearingPriceUsd={MOCK_COMMITMENT_LIVE.clearingPriceUsd}
                      myBid={s.myBid}
                      gate={s.gate}
                      previewConnected
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </GallerySection>
      </div>
    </main>
  )
}
