import { notFound } from "next/navigation"
/**
 * Dev-only state harness: for every state, renders the sticky bar both collapsed
 * (metrics + opening CTA) and expanded (metrics + stepper on top, flow below), so the
 * whole funnel is reviewable without a wallet or Sonar. Gated out of production. The
 * metrics / pill / compact-bar markup are a dev replica of BidPanel.
 */
import type { ReactNode } from "react"
import { AwarenessBarBody } from "../../(layout)/BidPanelAwareness"
import { BidFlow } from "../../(sections)/bid/BidFlow"
import { BidStatusTag, FunnelSteps } from "../../(sections)/bid/FunnelSteps"
import { CtaArrow } from "../../(ui)/CtaArrow"
import { Icon } from "../../(ui)/Icon"
import { fmtCompactUsd, fmtCount, fmtPrice } from "../../../lib/sale/format"
import { bidCtaLabel } from "../../../lib/sale/labels"
import { MOCK_COMMITMENT_LIVE, MOCK_JOURNEY_INPUTS } from "../../../lib/sale/mock"
import { stateOverridesEnabled } from "../../../lib/sale/overrides"
import type { JourneyState } from "../../../lib/sale/types"

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
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-contrast px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast">
      <BidStatusTag journey={journey} />
      {bidCtaLabel(journey)}
      <CtaArrow />
    </span>
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
      <MetricsRow dense={false} right={<CtaPill journey={journey} />} />
    </div>
  )
}

/** Expanded bar: metrics + stepper (+ bid CTA) on top, flow content below. */
function ExpandedBar({ journey }: { journey: JourneyState }) {
  const input = MOCK_JOURNEY_INPUTS[journey]
  return (
    <div className="overflow-hidden rounded-[var(--frame-radius)] border border-border bg-background">
      <div className="px-6 lg:px-8">
        <MetricsRow dense={true} right={<FunnelSteps journey={journey} />} />
      </div>
      <div className="px-6 py-6 lg:px-8">
        <div className="bid-capsule px-6 py-5">
          <BidFlow
            journey={journey}
            clearingPriceUsd={input.clearingPriceUsd}
            myBid={input.myBid}
          />
        </div>
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
            headline="Auction closed"
            sub="Final clearing $0.1161"
            cta="View results"
          />
        </section>

        {/* Awareness bar (touch devices or < lg windows): the REAL read-only body
            per phase - no funnel CTA by design. The live bar swaps to it when the
            funnel gate is off; preview it for real by resizing the window below lg. */}
        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-foreground">
            awareness bar (touch or &lt; lg) - read-only, per phase
          </p>
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
        </section>

        {/* The pre-sale + ended bar matrices render REAL components driven by the dev
            overrides, so link to the live bar instead of duplicating its copy. The ended
            bar's "View results" expands a panel that connects the WALLET, then shows the
            settlement; the journey override seeds the mock commitment for that panel. */}
        <section className="flex flex-col gap-3 border-t border-border pt-6">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-foreground">
            pre-sale + ended bar states (drive the real bar)
          </p>
          <ul className="flex flex-col gap-1.5 text-sm text-muted">
            {[
              ["notify (stage A)", "/?phase=pre-sale&registration=closed&journey=kyc-required"],
              ["register (stage B)", "/?phase=pre-sale&registration=open&journey=kyc-required"],
              ["pending", "/?phase=pre-sale&registration=open&journey=kyc-pending"],
              ["failed", "/?phase=pre-sale&registration=open&journey=kyc-failed"],
              ["not eligible", "/?phase=pre-sale&registration=open&journey=not-eligible"],
              ["registered", "/?phase=pre-sale&registration=open&journey=disconnected"],
              ["auth error", "/?phase=pre-sale&auth=error&journey=kyc-required"],
              [
                "ended - won (expand -> connect -> allocation)",
                "/?phase=ended&journey=has-bid-winning",
              ],
              [
                "ended - outbid (expand -> connect -> claim)",
                "/?phase=ended&journey=has-bid-outbid",
              ],
            ].map(([label, href]) => (
              <li key={href}>
                <a href={href} className="link-underline hover:text-foreground">
                  {label} <code className="font-mono text-xs">{href}</code>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
