"use client"

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
import {
  SUPPORT_CONTACT_HREF,
  VERIFY_STATUS,
  WELCOME_BACK,
  bidCtaLabel,
} from "../../lib/sale/labels"
import { useSonarSeen } from "../../lib/sale/returning"
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
  useBarGrow,
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
  const sonarSeen = useSonarSeen()
  const queryClient = useQueryClient()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasExpanded = useRef(false)
  const ctaRef = useCtaEntrance<HTMLSpanElement>({ delayMs: 1250 })
  const cardRef = useBarGrow<HTMLDivElement>()

  function handleSignOut() {
    postSonarLogout().then(
      () => {
        queryClient.invalidateQueries({ queryKey: ["sale", "entity"] })
        queryClient.invalidateQueries({ queryKey: ["sale", "my-bid"] })
      },
      () => {},
    )
  }

  // Re-poll the Sonar entity so a pending reviewer can re-check status without re-auth.
  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["sale", "entity"] })
  }

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
    const countToSale = preSaleStage === "registration-open" || barState === "registered"
    return (
      <BarShell>
        <DrawLine immediate />
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-4 sm:py-6">
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
            returning={sonarSeen}
            onRegister={redirectToSonarLogin}
            onSignOut={handleSignOut}
            onRefresh={handleRefresh}
          />
        </div>
      </BarShell>
    )
  }

  if (phase === "ended") {
    return (
      <BarShell>
        <DrawLine immediate />
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-4 sm:py-6">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:gap-x-9">
            <span className="status-pill">Closed</span>
            {finalMetrics(commitment).map((c) => (
              <MetricCell key={c.label} metric={c} />
            ))}
          </div>
          {expanded ? (
            <CloseButton onClick={() => setExpanded(false)} />
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
      <div ref={cardRef} className={CARD}>
        <div className="bar-content-enter grid grid-cols-12 gap-6 px-6 lg:px-0">
          <Entrance className="band-10">
            <DrawLine immediate delayMs={200} />
            <div className="py-4 sm:py-6">
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
                      <CloseButton onClick={() => setExpanded(false)} />
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

        <div className="grid grid-cols-12 gap-6 px-6 lg:px-0">
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
                      returning={sonarSeen}
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

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
  )
}

function SignOutLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-foreground"
    >
      Sign out of Sonar
    </button>
  )
}

// Verification-status row: status + discreet sign-out link, with the calendar CTA set off right.
function StatusRow({
  icon,
  tone = "default",
  title,
  body,
  onSignOut,
  onRefresh,
  withCalendar = false,
  contactHref,
}: {
  icon: string
  tone?: "default" | "danger" | "ok"
  title: string
  body?: string
  onSignOut: () => void
  onRefresh?: () => void
  withCalendar?: boolean
  contactHref?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <BarStatus icon={icon} tone={tone} title={title} body={body} />
        {contactHref ? (
          <a
            href={contactHref}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-semibold text-foreground underline underline-offset-2 transition-opacity hover:opacity-70"
          >
            Contact support
          </a>
        ) : null}
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Refresh
          </button>
        ) : null}
        <SignOutLink onClick={onSignOut} />
      </div>
      {withCalendar ? <AddToCalendarButton milestone="sale" variant="bar" /> : null}
    </div>
  )
}

export function PreSaleRight({
  state,
  returning,
  onRegister = () => {},
  onSignOut = () => {},
  onRefresh = () => {},
}: {
  state: PreSaleBarState
  returning: boolean
  onRegister?: () => void
  onSignOut?: () => void
  onRefresh?: () => void
}) {
  switch (state) {
    case "notify":
      return newsletterEnabled() ? (
        <div className="flex flex-wrap items-start gap-5">
          <NewsletterForm variant="bar" inputId="newsletter-email-bar" />
          <AddToCalendarButton milestone="registration" variant="bar" />
        </div>
      ) : (
        <p className="text-sm text-muted">{`Sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}`}</p>
      )
    case "register":
      return returning ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <BarStatus
            icon={WELCOME_BACK.icon}
            title={`${WELCOME_BACK.title}.`}
            body={WELCOME_BACK.body}
          />
          <button type="button" onClick={onRegister} className={CTA_PILL}>
            <span className="inline-flex items-center gap-2">
              <span>{WELCOME_BACK.cta}</span>
              <CtaArrow />
            </span>
          </button>
        </div>
      ) : (
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
        <StatusRow
          icon={VERIFY_STATUS.pending.icon}
          tone={VERIFY_STATUS.pending.tone}
          title={`${VERIFY_STATUS.pending.title}.`}
          body={VERIFY_STATUS.pending.body}
          onSignOut={onSignOut}
          onRefresh={onRefresh}
          withCalendar
        />
      )
    case "failed":
      return (
        <StatusRow
          icon={VERIFY_STATUS.failed.icon}
          tone={VERIFY_STATUS.failed.tone}
          title={`${VERIFY_STATUS.failed.title}.`}
          body={VERIFY_STATUS.failed.body}
          onSignOut={onSignOut}
          withCalendar
          contactHref={SUPPORT_CONTACT_HREF ?? undefined}
        />
      )
    case "not-eligible":
      return (
        <StatusRow
          icon={VERIFY_STATUS["not-eligible"].icon}
          tone={VERIFY_STATUS["not-eligible"].tone}
          title={`${VERIFY_STATUS["not-eligible"].title}.`}
          body={VERIFY_STATUS["not-eligible"].body}
          onSignOut={onSignOut}
          withCalendar
        />
      )
    case "registered":
      return (
        <StatusRow
          icon={VERIFY_STATUS.verified.icon}
          tone={VERIFY_STATUS.verified.tone}
          title={`${VERIFY_STATUS.verified.title}.`}
          onSignOut={onSignOut}
          withCalendar
        />
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
      return state satisfies never
  }
}
