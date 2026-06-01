import { notFound } from "next/navigation"
/**
 * Dev-only state harness: for every state, renders the sticky bar BOTH collapsed
 * (metrics + opening CTA) and expanded (metrics + stepper [+ bid CTA] on top,
 * flow content below on surface-alt), full width, so the whole funnel and the
 * open/close affordance are reviewable without a wallet or Sonar. Gated out of
 * production. The metrics / pill / compact-bar markup mirror BidPanel (dev replica).
 */
import type { ReactNode } from "react"
import { BidFlow, BidStatus, FunnelSteps } from "../../(sections)/bid/BidFlow"
import { Icon } from "../../(ui)/Icon"
import { percentFilled } from "../../../lib/sale/calc"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"
import { bidCtaLabel } from "../../../lib/sale/labels"
import { MOCK_COMMITMENT_LIVE, MOCK_JOURNEY_INPUTS } from "../../../lib/sale/mock"
import type { JourneyState } from "../../../lib/sale/types"

const fmtPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
const fmtCompact = (n: number) =>
  n.toLocaleString("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  })
const fmtCount = (n: number) => n.toLocaleString("en-US")

const filledPct = Math.round(
  percentFilled(
    MOCK_COMMITMENT_LIVE.totalCommittedUsd,
    MOCK_COMMITMENT_LIVE.clearingPriceUsd,
    SALE_ECONOMICS.saleSupplyGnot,
  ) * 100,
)

const METRICS = [
  {
    icon: "clearing",
    value: MOCK_COMMITMENT_LIVE.clearingPriceUsd
      ? fmtPrice(MOCK_COMMITMENT_LIVE.clearingPriceUsd)
      : "TBD",
    label: "Clearing",
  },
  { icon: "progress-ring", value: `${filledPct}%`, label: "Filled (est.)" },
  {
    icon: "users-group",
    value: fmtCount(MOCK_COMMITMENT_LIVE.uniqueCommitmentCount),
    label: "Bidders",
  },
  {
    icon: "database",
    value: fmtCompact(MOCK_COMMITMENT_LIVE.totalCommittedUsd),
    label: "Committed",
  },
]

function CtaPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-contrast px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast">
      {label}
      <svg
        viewBox="0 0 12 12"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function MetricsRow({
  journey,
  dense,
  right,
}: {
  journey: JourneyState
  dense: boolean
  right: ReactNode
}) {
  return (
    <div className="border-t border-border pb-6 pt-4">
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
          <BidStatus journey={journey} />
        </div>
        {right}
      </div>
    </div>
  )
}

/** Collapsed bar: metrics + the opening CTA on the right. */
function CollapsedBar({ journey }: { journey: JourneyState }) {
  return (
    <div className="rounded-[var(--frame-radius)] border border-border bg-background px-6 lg:px-8">
      <MetricsRow
        journey={journey}
        dense={false}
        right={<CtaPill label={bidCtaLabel(journey)} />}
      />
    </div>
  )
}

/** Expanded bar: metrics + stepper (+ bid CTA) on top, flow content below. */
function ExpandedBar({ journey }: { journey: JourneyState }) {
  const input = MOCK_JOURNEY_INPUTS[journey]
  return (
    <div className="overflow-hidden rounded-[var(--frame-radius)] border border-border bg-background">
      <div className="px-6 lg:px-8">
        <MetricsRow journey={journey} dense={true} right={<FunnelSteps journey={journey} />} />
      </div>
      <div className="border-t border-border-strong bg-surface-alt px-6 py-6 lg:px-8">
        <BidFlow journey={journey} clearingPriceUsd={input.clearingPriceUsd} myBid={input.myBid} />
      </div>
    </div>
  )
}

/** Replica of the pre-sale / ended compact bar. */
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
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border pb-6 pt-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{lead}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{headline}</p>
            <p className="mt-1 text-sm text-muted">{sub}</p>
          </div>
          <span className="rounded-full bg-surface-contrast px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast">
            {cta}
          </span>
        </div>
      </div>
    </div>
  )
}

function Caption({ children }: { children: string }) {
  return <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-faint">{children}</p>
}

export default function DevStatesPage() {
  if (process.env.NODE_ENV === "production") notFound()

  const states = Object.keys(MOCK_JOURNEY_INPUTS) as JourneyState[]

  return (
    <main className="mx-auto max-w-[var(--max-width-container)] px-6 py-10 lg:px-8">
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

      <div className="flex flex-col gap-10">
        {states.map((s) => (
          <section key={s} className="flex flex-col gap-3 border-t border-border pt-6">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-foreground">
              {s}
            </p>
            <Caption>Collapsed</Caption>
            <CollapsedBar journey={s} />
            <Caption>Expanded</Caption>
            <ExpandedBar journey={s} />
          </section>
        ))}

        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-foreground">
            phase bars
          </p>
          <CompactPreview
            lead="Public sale"
            headline="Opens July 15, 2026"
            sub="Registration opens July 1"
            cta="Register now"
          />
          <CompactPreview
            lead="Public sale"
            headline="Auction closed"
            sub="Final clearing $0.12"
            cta="View results"
          />
        </section>
      </div>
    </main>
  )
}
