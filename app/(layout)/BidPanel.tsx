"use client"

/**
 * Sticky bid bar. Collapsed it shows the live keynumber metrics (clearing,
 * time-left, bidders, committed) plus a marketing "Place a bid" CTA. Clicking the
 * CTA EXPANDS the bar upward into a panel hosting the BidFlow (connect -> verify ->
 * bid form -> submit). Escape or the Close button collapses it. Phase-driven:
 * pre-sale and ended render their own compact bars (BarShell). Data comes from
 * useSale() (mock today, Sonar proxy later behind the same shape).
 */
import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { BidFlow } from "../(sections)/bid/BidFlow"
import { BidStatus, FunnelSteps } from "../(sections)/bid/FunnelSteps"
import { Icon } from "../(ui)/Icon"
import { startSonarLogin } from "../../lib/sale/api"
import { gnotEstimate } from "../../lib/sale/calc"
import { SALE_ECONOMICS, formatSaleDate } from "../../lib/sale/economics"
import { fmtCompactUsd, fmtCount, fmtGnot, fmtPrice } from "../../lib/sale/format"
import { useBid } from "../../lib/sale/hooks"
import { bidCtaLabel } from "../../lib/sale/labels"
import { Countdown } from "./Countdown"
import { useSale } from "./SaleProvider"
import { WalletButton } from "./WalletButton"

const SHELL =
  "fixed bottom-[var(--reveal-padding)] left-[var(--reveal-padding)] right-[var(--reveal-padding)] z-[var(--z-sticky)] overflow-hidden rounded-[var(--frame-radius)] border border-border bg-background"
const INSET = "mx-auto max-w-[var(--max-width-container)] px-6 lg:px-8"

type BarMetric = { icon: string; value: ReactNode; label: string }

export function BidPanel() {
  const { phase, preSaleStage, journey, commitment, myBid } = useSale()
  const bid = useBid()
  const [expanded, setExpanded] = useState(false)

  // Start the Sonar OAuth login (the kyc-required gate's CTA). In mock this
  // short-circuits to a logged-in session; in prod it redirects to Sonar's page.
  function handleConnectSonar() {
    startSonarLogin().then(
      (url) => {
        window.location.href = url
      },
      () => {
        /* login start failed; the gate keeps offering "Verify with Sonar" */
      },
    )
  }

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded])

  if (phase === "pre-sale") {
    const registrationOpen = preSaleStage === "registration-open"
    return (
      <BarShell>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-border pb-6 pt-4 sm:pb-8 sm:pt-6">
          <div className="flex items-center gap-3">
            <Icon name="clock" className="h-[18px] w-[18px]" />
            <div>
              <p className="font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
                <Countdown targetIso={SALE_ECONOMICS.saleOpensIso} />
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
                Opens {formatSaleDate(SALE_ECONOMICS.saleOpensIso)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="text-sm text-muted">
              {registrationOpen
                ? "Registration is open"
                : `Registration opens ${formatSaleDate(SALE_ECONOMICS.registrationOpensIso, false)}`}
            </p>
            <button
              type="button"
              className="group inline-flex items-center gap-2 rounded-full bg-surface-contrast px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast transition-colors hover:bg-surface-contrast/80"
            >
              <span>{registrationOpen ? "Register now" : "Get notified"}</span>
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
          </div>
        </div>
      </BarShell>
    )
  }

  if (phase === "ended") {
    const hasBid = myBid !== null
    const clearingUsd = commitment.clearingPriceUsd ?? 0
    const finalCells: BarMetric[] = [
      { icon: "clearing", value: fmtPrice(clearingUsd), label: "Final price" },
      { icon: "database", value: fmtCompactUsd(commitment.totalCommittedUsd), label: "Raised" },
      { icon: "users-group", value: fmtCount(commitment.uniqueCommitmentCount), label: "Bidders" },
    ]
    if (hasBid && myBid) {
      finalCells.push({
        icon: "cube",
        value: fmtGnot(gnotEstimate(myBid.committedUsd, clearingUsd)),
        label: "Your allocation",
      })
    }
    return (
      <BarShell>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-border pb-6 pt-4 sm:pb-8 sm:pt-6">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:gap-x-9">
            <span className="rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Closed
            </span>
            {finalCells.map((c) => (
              <div key={c.label}>
                <div className="flex items-center gap-2">
                  <Icon name={c.icon} className="h-[18px] w-[18px]" />
                  <p className="font-mono text-lg font-medium tracking-tight tabular-nums">
                    {c.value}
                  </p>
                </div>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
                  {c.label}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="group inline-flex items-center gap-2 rounded-full bg-surface-contrast px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast transition-colors hover:bg-surface-contrast/80"
          >
            <span>{hasBid ? "Claim refund" : "View results"}</span>
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
        </div>
      </BarShell>
    )
  }

  const metrics: BarMetric[] = [
    {
      icon: "clearing",
      value: commitment.clearingPriceUsd ? fmtPrice(commitment.clearingPriceUsd) : "TBD",
      label: "Clearing",
    },
    {
      icon: "clock",
      value: <Countdown targetIso={SALE_ECONOMICS.saleClosesIso} />,
      label: "Time left",
    },
    { icon: "users-group", value: fmtCount(commitment.uniqueCommitmentCount), label: "Bidders" },
    { icon: "database", value: fmtCompactUsd(commitment.totalCommittedUsd), label: "Committed" },
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
        <div className={INSET}>
          <div className="grid grid-cols-12 gap-6 pb-4 sm:pb-6">
            <div className="col-span-12 lg:col-span-10 lg:col-start-2">
              <div className="bid-capsule max-h-[60vh] overflow-y-auto px-6 py-5">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                  <div className="min-w-0 flex-1">
                    <BidFlow
                      journey={journey}
                      clearingPriceUsd={commitment.clearingPriceUsd}
                      myBid={myBid}
                      onConnectSonar={handleConnectSonar}
                      onBid={bid.submit}
                    />
                  </div>
                  <WalletButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

/** Shared bar shell: SHELL frame + inset + 12-col grid, content inset to cols 2-11. */
function BarShell({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Bid panel" data-component="bid-panel" className={SHELL}>
      <div className={INSET}>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">{children}</div>
        </div>
      </div>
    </aside>
  )
}
