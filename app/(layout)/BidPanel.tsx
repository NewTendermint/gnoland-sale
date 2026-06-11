"use client"

/**
 * Sticky bid bar. Collapsed it shows the live metrics (clearing, time-left, bidders,
 * committed) plus the "Place a bid" CTA; clicking it expands the bar upward into a
 * panel hosting the BidFlow (connect -> verify -> bid form -> submit). Escape or Close
 * collapses it. Phase-driven: pre-sale and ended render their own compact bars
 * (BarShell). Data comes from useSale().
 */
import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { BidFlow } from "../(sections)/bid/BidFlow"
import { BidStatusTag, FunnelSteps } from "../(sections)/bid/FunnelSteps"
import { CtaArrow } from "../(ui)/CtaArrow"
import { DrawLine } from "../(ui)/DrawLine"
import { Entrance } from "../(ui)/Entrance"
import { Icon } from "../(ui)/Icon"
import { Stagger } from "../(ui)/Stagger"
import { useCtaEntrance } from "../../lib/motion/use-motion"
import { startSonarLogin } from "../../lib/sale/api"
import { gnotEstimate } from "../../lib/sale/calc"
import { SALE_ECONOMICS, formatSaleDate } from "../../lib/sale/economics"
import { fmtCompactUsd, fmtCount, fmtGnot, fmtPrice } from "../../lib/sale/format"
import { useBid } from "../../lib/sale/hooks"
import { bidCtaLabel } from "../../lib/sale/labels"
import { Countdown } from "./Countdown"
import { useSale } from "./SaleProvider"
import { WalletButton } from "./WalletButton"

// Positioning shell: pinned above the page frame, capped to the container and
// gutter-padded so the card inside lands exactly on the 12-col grid width.
const SHELL =
  "bar-enter fixed bottom-[var(--reveal-padding)] left-[var(--reveal-padding)] right-[var(--reveal-padding)] z-[var(--z-sticky)] mx-auto max-w-[var(--max-width-container)] px-6 lg:px-8"
// Visible card: its edges align with the section grids (container minus gutters).
const CARD = "overflow-hidden rounded-t-[var(--frame-radius)] bg-background"
// Solid inverted CTA pill, shared across the bar's phase states (pre-sale / live / ended).
const CTA_PILL =
  "btn-pan group inline-flex cursor-pointer items-center justify-center rounded-full border border-faint bg-surface-contrast px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast before:bg-on-contrast hover:text-surface-contrast"

type BarMetric = { icon: string; value: ReactNode; label: string }

export function BidPanel() {
  const {
    phase,
    preSaleStage,
    journey,
    commitment,
    myBid,
    bidPanelOpen: expanded,
    setBidPanelOpen: setExpanded,
  } = useSale()
  const bid = useBid()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasExpanded = useRef(false)
  // CTA page-load entrance: the pill scales in, then its label fades in. Lands on
  // a wrapping <span> (not the button itself) because the button already carries
  // triggerRef for focus management - one DOM node can hold only one ref.
  const ctaRef = useCtaEntrance<HTMLSpanElement>({ delayMs: 1250 })

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

  // The expanded panel behaves like a disclosure/bottom-sheet: move focus into it on
  // open, return focus to the trigger on close, and let Escape close it, so keyboard
  // users are never stranded at the top of the document.
  useEffect(() => {
    if (expanded) {
      panelRef.current?.focus()
    } else if (wasExpanded.current) {
      triggerRef.current?.focus()
    }
    wasExpanded.current = expanded
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded, setExpanded])

  // Kill-switch (SALE_PAUSED, surfaced via the polled commitments feed): a global
  // override shown regardless of phase. The mutating routes already 503. Placeholder
  // copy, pending final wording.
  if (commitment.paused) {
    return (
      <BarShell>
        <DrawLine immediate />
        <div className="flex flex-wrap items-center gap-3 pb-6 pt-4 sm:pb-8 sm:pt-6">
          <Icon name="clock" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
          <p className="text-sm">
            <span className="font-medium text-foreground">Bidding is paused.</span>{" "}
            <span className="text-muted">Please check back shortly.</span>
          </p>
        </div>
      </BarShell>
    )
  }

  if (phase === "pre-sale") {
    const registrationOpen = preSaleStage === "registration-open"
    return (
      <BarShell>
        <DrawLine immediate />
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 pb-6 pt-4 sm:pb-8 sm:pt-6">
          <div className="flex items-center gap-3">
            <Icon name="clock" draw={false} className="h-[18px] w-[18px]" />
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
              onClick={registrationOpen ? handleConnectSonar : undefined}
              className={CTA_PILL}
            >
              <span className="inline-flex items-center gap-2">
                <span>{registrationOpen ? "Register now" : "Get notified"}</span>
                <CtaArrow />
              </span>
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
        <DrawLine immediate />
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 pb-6 pt-4 sm:pb-8 sm:pt-6">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:gap-x-9">
            <span className="rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Closed
            </span>
            {finalCells.map((c) => (
              <div key={c.label}>
                <div className="flex items-center gap-2">
                  <Icon name={c.icon} draw={false} className="h-[18px] w-[18px]" />
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
          <button type="button" className={CTA_PILL}>
            <span className="inline-flex items-center gap-2">
              <span>{hasBid ? "Claim refund" : "View results"}</span>
              <CtaArrow />
            </span>
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
      <div className={CARD}>
        <div className="grid grid-cols-12 gap-6">
          <Entrance className="col-span-12 lg:col-span-10 lg:col-start-2">
            <DrawLine immediate delayMs={200} />
            <div className="pb-6 pt-4 sm:pb-8 sm:pt-6">
              <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
                <Stagger
                  as="div"
                  immediate
                  delayMs={900}
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
                          <Icon name={m.icon} draw={false} className="h-[18px] w-[18px]" />
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
                </Stagger>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {expanded ? (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <FunnelSteps journey={journey} />
                      <button
                        type="button"
                        onClick={() => setExpanded(false)}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-colors duration-300 hover:border-surface-contrast hover:bg-surface-contrast hover:text-on-contrast"
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
                    <span ref={ctaRef} className="inline-flex">
                      <button
                        type="button"
                        ref={triggerRef}
                        onClick={() => setExpanded(true)}
                        aria-expanded={expanded}
                        className={CTA_PILL}
                      >
                        <span data-cta-label className="inline-flex items-center gap-2">
                          <BidStatusTag journey={journey} />
                          <span>{bidCtaLabel(journey)}</span>
                          <CtaArrow />
                        </span>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Entrance>
        </div>

        {/* Expanding sheet: the height animates 0 -> auto via the grid-rows 0fr/1fr
            trick (the panel is always mounted so it has a height to grow into; `inert`
            when collapsed keeps the hidden form out of the tab order). BidFlow's wagmi
            hooks are passive subscriptions (no network / no auto-connect), so mounting
            it early is cheap. Same easeOutExpo as the page's other motion; no
            transition under prefers-reduced-motion. */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">
            <div
              className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pb-4 sm:pb-6">
                  <div
                    ref={panelRef}
                    tabIndex={-1}
                    inert={!expanded}
                    className={`bid-capsule max-h-[60vh] overflow-y-auto px-6 py-5 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none motion-reduce:transition-none ${
                      expanded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <BidFlow
                      journey={journey}
                      clearingPriceUsd={commitment.clearingPriceUsd}
                      myBid={myBid}
                      onConnectSonar={handleConnectSonar}
                      onBid={bid.submit}
                      walletButton={<WalletButton />}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

/** Shared bar shell: SHELL frame + inset + 12-col grid, content inset to cols 2-11. */
function BarShell({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Bid panel" data-component="bid-panel" className={SHELL}>
      <div className={CARD}>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-10 lg:col-start-2">{children}</div>
        </div>
      </div>
    </aside>
  )
}
