"use client"

/**
 * Sticky bid bar. Collapsed it shows the live keynumber metrics (clearing,
 * filled, bidders, committed) plus a marketing "Place a bid" CTA. Clicking the CTA
 * EXPANDS the bar upward into a panel that hosts the BidFlow (connect -> KYC ->
 * price/amount/lockup form -> sign -> submitted). Escape or the backdrop closes
 * it (bottom-sheet / modal pattern, ADR §6.4). Phase-driven: pre-sale and ended
 * render their own compact bars. Data comes from useSale() (mock today, Sonar
 * proxy later behind the same shape).
 */
import { useEffect, useState } from "react"
import { BidFlow, BidStatus, FunnelSteps } from "../(sections)/bid/BidFlow"
import { Icon } from "../(ui)/Icon"
import { percentFilled } from "../../lib/sale/calc"
import { SALE_ECONOMICS } from "../../lib/sale/economics"
import { bidCtaLabel } from "../../lib/sale/labels"
import { useSale } from "./SaleProvider"

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

const SHELL =
  "fixed bottom-[var(--reveal-padding)] left-[var(--reveal-padding)] right-[var(--reveal-padding)] z-[var(--z-sticky)] overflow-hidden rounded-[var(--frame-radius)] border border-border bg-background"
const INSET = "mx-auto max-w-[var(--max-width-container)] px-6 lg:px-8"

export function BidPanel() {
  const { phase, preSaleStage, journey, commitment, myBid } = useSale()
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded])

  if (phase === "pre-sale") {
    const label = preSaleStage === "registration-open" ? "Register now" : "Get notified"
    return (
      <CompactBar
        lead="Public sale"
        headline="Opens July 15, 2026"
        cta={label}
        sub={
          preSaleStage === "registration-open"
            ? "Registration is open"
            : "Registration opens July 1"
        }
      />
    )
  }

  if (phase === "ended") {
    return (
      <CompactBar
        lead="Public sale"
        headline="Auction closed"
        cta="View results"
        sub={
          commitment.clearingPriceUsd
            ? `Final clearing ${fmtPrice(commitment.clearingPriceUsd)}`
            : undefined
        }
      />
    )
  }

  const filled = Math.round(
    percentFilled(
      commitment.totalCommittedUsd,
      commitment.clearingPriceUsd,
      SALE_ECONOMICS.saleSupplyGnot,
    ) * 100,
  )
  const metrics = [
    {
      icon: "clearing",
      value: commitment.clearingPriceUsd ? fmtPrice(commitment.clearingPriceUsd) : "TBD",
      label: "Clearing",
    },
    { icon: "progress-ring", value: `${filled}%`, label: "Filled (est.)" },
    { icon: "users-group", value: fmtCount(commitment.uniqueCommitmentCount), label: "Bidders" },
    { icon: "database", value: fmtCompact(commitment.totalCommittedUsd), label: "Committed" },
  ]

  return (
    <aside aria-label="Bid panel" data-component="bid-panel" className={SHELL}>
      <div className={INSET}>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            <div className="border-t border-border pb-6 pt-4 sm:pb-8 sm:pt-6">
              <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
                <div
                  className={`flex flex-wrap items-center ${
                    expanded ? "gap-x-5 gap-y-2 sm:gap-x-7" : "gap-8 sm:gap-10"
                  }`}
                >
                  {metrics.map((m, i) => (
                    <div
                      key={m.label}
                      className={`flex items-center ${
                        expanded ? "gap-x-5 sm:gap-x-7" : "gap-8 sm:gap-10"
                      }`}
                    >
                      {i > 0 ? (
                        <div aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />
                      ) : null}
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon name={m.icon} className="h-[18px] w-[18px]" />
                          <p
                            className={`font-mono font-medium tracking-tight tabular-nums ${
                              expanded ? "text-lg" : "text-2xl sm:text-3xl"
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

                {expanded ? (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <FunnelSteps journey={journey} />
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      aria-label="Close"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    aria-expanded={expanded}
                    className="group inline-flex items-center gap-2 rounded-full bg-surface-contrast px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast transition-colors hover:bg-surface-contrast/80"
                  >
                    <span>{bidCtaLabel(journey)}</span>
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M2 6h8M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-border-strong bg-surface-alt">
          <div className={INSET}>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-10 lg:col-start-2">
                <div className="max-h-[60vh] overflow-y-auto py-6">
                  <BidFlow
                    journey={journey}
                    clearingPriceUsd={commitment.clearingPriceUsd}
                    myBid={myBid}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

/** Compact single-message bar for pre-sale / ended phases (no expand). */
function CompactBar({
  lead,
  headline,
  sub,
  cta,
}: {
  lead: string
  headline: string
  sub?: string
  cta: string
}) {
  return (
    <aside aria-label="Bid panel" data-component="bid-panel" className={SHELL}>
      <div className={INSET}>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border pb-6 pt-4 sm:pb-8 sm:pt-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                  {lead}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {headline}
                </p>
                {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-surface-contrast px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast transition-colors hover:bg-surface-contrast/80"
              >
                {cta}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
