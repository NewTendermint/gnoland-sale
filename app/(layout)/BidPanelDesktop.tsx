"use client"

/**
 * Desktop (funnel-capable) sticky bid bar. Collapsed it shows the live metrics
 * (clearing, time-left, bidders, committed) plus the "Place a bid" CTA; clicking it
 * expands the bar upward into a panel hosting the BidFlow (connect -> verify -> bid
 * form -> submit). Escape or Close collapses it. Phase-driven: pre-sale and ended
 * render their own compact bars (BarShell). Data comes from useSale(). Only mounted
 * on funnel-capable contexts (see BidPanel.tsx dispatcher + lib/device/funnel-gate.ts);
 * the paused kill-switch lives in the dispatcher.
 */
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef } from "react"
import { BidFlow } from "../(sections)/bid/BidFlow"
import { BidStatusTag, FunnelSteps } from "../(sections)/bid/FunnelSteps"
import { SettlementFlow } from "../(sections)/bid/SettlementFlow"
import { CtaArrow } from "../(ui)/CtaArrow"
import { DrawLine } from "../(ui)/DrawLine"
import { Entrance } from "../(ui)/Entrance"
import { Icon } from "../(ui)/Icon"
import { Stagger } from "../(ui)/Stagger"
import { useCtaEntrance } from "../../lib/motion/use-motion"
import { newsletterEnabled } from "../../lib/newsletter/config"
import { postSonarLogout, redirectToSonarLogin } from "../../lib/sale/api"
import { SALE_ECONOMICS, formatSaleDate } from "../../lib/sale/economics"
import { useBid, useClaim } from "../../lib/sale/hooks"
import { derivePreSaleBar } from "../../lib/sale/journey"
import { VERIFY_STATUS, bidCtaLabel } from "../../lib/sale/labels"
import type { PreSaleBarState } from "../../lib/sale/types"
import { AddToCalendarButton } from "./AddToCalendarButton"
import {
  BarCountdown,
  BarShell,
  BarStatus,
  CARD,
  CTA_PILL,
  MetricCell,
  SHELL,
  finalMetrics,
  liveMetrics,
} from "./BidBarShell"
import { NewsletterForm } from "./NewsletterForm"
import { useSale } from "./SaleProvider"
import { WalletButton } from "./WalletButton"

export function BidPanelDesktop() {
  const {
    phase,
    preSaleStage,
    journey,
    commitment,
    myBid,
    sonarReturn,
    bidPanelOpen: expanded,
    setBidPanelOpen: setExpanded,
  } = useSale()
  const bid = useBid()
  const claim = useClaim()
  const queryClient = useQueryClient()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasExpanded = useRef(false)
  // CTA page-load entrance: the pill scales in, then its label fades in. Lands on
  // a wrapping <span> (not the button itself) because the button already carries
  // triggerRef for focus management - one DOM node can hold only one ref.
  const ctaRef = useCtaEntrance<HTMLSpanElement>({ delayMs: 1250 })

  // End the Sonar link (the pre-sale registered state's quiet escape hatch, e.g.
  // wrong account). Refetching entity + position drops the journey to kyc-required.
  function handleSignOut() {
    postSonarLogout().then(
      () => {
        queryClient.invalidateQueries({ queryKey: ["sale", "entity"] })
        queryClient.invalidateQueries({ queryKey: ["sale", "my-bid"] })
      },
      () => {
        /* logout failed; the link stays and can be retried */
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

  if (phase === "pre-sale") {
    const barState = derivePreSaleBar(preSaleStage, journey, sonarReturn)
    // One countdown, always to the user's NEXT milestone: registration opening
    // first, then the sale opening - and a registered user's next milestone is
    // the sale itself, whatever the stage.
    const countToSale = preSaleStage === "registration-open" || barState === "registered"
    return (
      <BarShell>
        <DrawLine immediate />
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 pb-6 pt-4 sm:pb-8 sm:pt-6">
          <BarCountdown
            targetIso={
              countToSale ? SALE_ECONOMICS.saleOpensIso : SALE_ECONOMICS.registrationOpensIso
            }
            caption={
              countToSale
                ? `Opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}`
                : `Registration opens ${formatSaleDate(SALE_ECONOMICS.registrationOpensIso, false)}`
            }
          />
          <PreSaleRight
            state={barState}
            onRegister={redirectToSonarLogin}
            onSignOut={handleSignOut}
          />
        </div>
      </BarShell>
    )
  }

  if (phase === "ended") {
    return (
      <BarShell>
        <DrawLine immediate />
        {/* Collapsed: global final metrics + one "View results" CTA. Like the live bar,
            it expands into a panel that connects the wallet then shows the settlement. */}
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 pb-6 pt-4 sm:pb-8 sm:pt-6">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:gap-x-9">
            <span className="status-pill">Closed</span>
            {finalMetrics(commitment).map((c) => (
              <MetricCell key={c.label} metric={c} />
            ))}
          </div>
          {expanded ? (
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
          ) : (
            <button
              type="button"
              ref={triggerRef}
              onClick={() => setExpanded(true)}
              aria-expanded={expanded}
              className={CTA_PILL}
            >
              <span className="inline-flex items-center gap-2">
                <span>View results</span>
                <CtaArrow />
              </span>
            </button>
          )}
        </div>

        {/* Expanding settlement sheet, same grid-rows 0fr->1fr trick and easing as the
            live panel: connect the wallet, then the per-bidder settlement + refund claim. */}
        <div
          className={`grid transition-[grid-template-rows] duration-500 ease-reveal motion-reduce:transition-none ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="pb-4 sm:pb-6">
              <div
                ref={panelRef}
                tabIndex={-1}
                inert={!expanded}
                className={`bid-capsule max-h-[60vh] overflow-y-auto px-6 py-5 transition-opacity duration-500 ease-reveal focus:outline-none motion-reduce:transition-none ${
                  expanded ? "opacity-100" : "opacity-0"
                }`}
              >
                <SettlementFlow
                  clearingPriceUsd={commitment.clearingPriceUsd}
                  myBid={myBid}
                  onClaim={claim.claim}
                />
              </div>
            </div>
          </div>
        </div>
      </BarShell>
    )
  }

  const metrics = liveMetrics(commitment)

  return (
    <aside aria-label="Bid panel" data-component="bid-panel" className={SHELL}>
      <div className={CARD}>
        <div className="page-container grid grid-cols-12 gap-6">
          <Entrance className="band-10">
            <DrawLine immediate delayMs={200} />
            <div className="pb-6 pt-4 sm:pb-8 sm:pt-6">
              <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
                <Stagger
                  as="div"
                  immediate
                  delayMs={900}
                  className={`flex flex-wrap items-center ${
                    expanded ? "gap-x-5 gap-y-2 sm:gap-x-7" : "gap-6 gap-y-2 sm:gap-7"
                  }`}
                >
                  {metrics.map((m, i) => (
                    <div
                      key={m.label}
                      className={`flex items-center ${
                        expanded ? "gap-x-5 sm:gap-x-7" : "gap-6 sm:gap-7"
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
        <div className="page-container grid grid-cols-12 gap-6">
          <div className="band-10">
            <div
              className={`grid transition-[grid-template-rows] duration-500 ease-reveal motion-reduce:transition-none ${
                expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pb-4 sm:pb-6">
                  <div
                    ref={panelRef}
                    tabIndex={-1}
                    inert={!expanded}
                    className={`bid-capsule max-h-[60vh] overflow-y-auto px-6 py-5 transition-opacity duration-500 ease-reveal focus:outline-none motion-reduce:transition-none ${
                      expanded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <BidFlow
                      journey={journey}
                      clearingPriceUsd={commitment.clearingPriceUsd}
                      myBid={myBid}
                      onConnectSonar={redirectToSonarLogin}
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

/**
 * Pre-sale bar right cluster, one branch per derivePreSaleBar state: the stage ask
 * (newsletter capture / register CTA) unless the user already has a Sonar status to
 * show, with the OAuth-return error on top. See lib/sale/journey.ts.
 */
function PreSaleRight({
  state,
  onRegister,
  onSignOut,
}: {
  state: PreSaleBarState
  onRegister: () => void
  onSignOut: () => void
}) {
  switch (state) {
    case "notify":
      return newsletterEnabled() ? (
        // items-start: the form's status line below would pull a centered round down.
        <div className="flex flex-wrap items-start gap-5">
          <NewsletterForm variant="bar" inputId="newsletter-email-bar" />
          <AddToCalendarButton milestone="registration" variant="bar" />
        </div>
      ) : (
        // Feature intentionally off: state the next date, no dead CTA.
        <p className="text-sm text-muted">{`Sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}`}</p>
      )
    case "register":
      return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="text-sm text-muted">Registration is open</p>
          <button type="button" onClick={onRegister} className={CTA_PILL}>
            <span className="inline-flex items-center gap-2">
              <span>Register now</span>
              <CtaArrow />
            </span>
          </button>
        </div>
      )
    case "pending":
      return (
        <BarStatus
          icon="clock"
          title={`${VERIFY_STATUS.pending.title}.`}
          body={VERIFY_STATUS.pending.body}
        />
      )
    case "failed":
      return (
        <BarStatus
          icon="shield-check"
          tone="danger"
          title={`${VERIFY_STATUS.failed.title}.`}
          body={VERIFY_STATUS.failed.body}
        />
      )
    case "not-eligible":
      return (
        <BarStatus
          icon="shield-check"
          tone="danger"
          title={`${VERIFY_STATUS["not-eligible"].title}.`}
          body={VERIFY_STATUS["not-eligible"].body}
        />
      )
    case "registered":
      return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <BarStatus
            icon="shield-check"
            tone="ok"
            title="You're registered."
            body={`The sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}.`}
          />
          <AddToCalendarButton milestone="sale" variant="bar" />
          <button
            type="button"
            onClick={onSignOut}
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Sign out of Sonar
          </button>
        </div>
      )
    case "auth-error":
      return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <BarStatus
            icon="shield-check"
            tone="danger"
            title="Could not connect to Sonar."
            body="Please try again."
          />
          <button type="button" onClick={onRegister} className={CTA_PILL}>
            <span className="inline-flex items-center gap-2">
              <span>Try again</span>
              <CtaArrow />
            </span>
          </button>
        </div>
      )
    default:
      // Compile-time exhaustiveness: a new PreSaleBarState must add a case here.
      return state satisfies never
  }
}
