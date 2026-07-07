"use client"

import { useQueryClient } from "@tanstack/react-query"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { useAccount } from "wagmi"
import { BidFlow } from "../(sections)/bid/BidFlow"
import { BidStatusTag, FunnelSteps } from "../(sections)/bid/FunnelSteps"
import { ManageEntityCta } from "../(sections)/bid/ManageEntity"
import { SettlementFlow } from "../(sections)/bid/SettlementFlow"
import { CloseButton } from "../(ui)/CloseButton"
import { Cta } from "../(ui)/Cta"
import { DrawLine } from "../(ui)/DrawLine"
import { Entrance } from "../(ui)/Entrance"
import { Icon } from "../(ui)/Icon"
import { Stagger } from "../(ui)/Stagger"
import { useCtaEntrance } from "../../lib/motion/use-motion"
import { newsletterEnabled } from "../../lib/newsletter/config"
import { postSonarLogout, redirectToSonarLogin } from "../../lib/sale/api"
import { gnotEstimate } from "../../lib/sale/calc"
import { SALE_ECONOMICS, formatSaleDate } from "../../lib/sale/economics"
import { fmtGnot, fmtPrice, fmtUsd } from "../../lib/sale/format"
import { useBid, useBidPrecheck, useClaim, useClaimGate } from "../../lib/sale/hooks"
import { derivePreSaleBar } from "../../lib/sale/journey"
import {
  SUPPORT_VERIFY_FAILED_HREF,
  VERIFY_INCOMPLETE,
  VERIFY_STATUS,
  WELCOME_BACK,
  bidCtaLabel,
  bidSectionTitle,
} from "../../lib/sale/labels"
import { clearPendingBid } from "../../lib/sale/pending-bid"
import { clearSonarSeen, useSonarSeen } from "../../lib/sale/returning"
import type { JourneyState, MyBid, PreSaleBarState } from "../../lib/sale/types"
import { AddToCalendarButton } from "./AddToCalendarButton"
import {
  BarCountdown,
  BarShell,
  BarStatus,
  CARD,
  MetricCell,
  MetricPendingChip,
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
    pendingBidDelta,
    entityResolved,
    positionResolved,
    sonarReturn,
    sonarSetupUrl,
    entityLabel,
    bidPanelOpen: expanded,
    setBidPanelOpen: setExpanded,
  } = useSale()
  const bid = useBid()
  const { precheck } = useBidPrecheck()
  const claim = useClaim()
  const claimGate = useClaimGate({ enabled: phase === "ended" })
  const sonarSeen = useSonarSeen()
  const { isConnected } = useAccount()
  const queryClient = useQueryClient()
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasExpanded = useRef(false)
  const ctaRef = useCtaEntrance<HTMLSpanElement>({ delayMs: 1250 })
  const cardRef = useBarGrow<HTMLDivElement>()
  // Remount BidFlow after collapse so reopening lands on the raise form.
  const [bidFlowEpoch, setBidFlowEpoch] = useState(0)
  useEffect(() => {
    if (expanded) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBidFlowEpoch((n) => n + 1)
    }
  }, [expanded])

  function handleSignOut() {
    postSonarLogout().then(
      () => {
        clearSonarSeen()
        clearPendingBid()
        queryClient.invalidateQueries({ queryKey: ["sale", "entity"] })
        queryClient.invalidateQueries({ queryKey: ["sale", "my-bid"] })
      },
      () => {},
    )
  }

  // Returns the refetch promise so RefreshButton can show a discreet pending state.
  function handleRefresh() {
    return queryClient.invalidateQueries({ queryKey: ["sale", "entity"] })
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
          <div className="ml-auto flex justify-end">
            <PreSaleRight
              state={barState}
              returning={sonarSeen}
              setupHref={sonarSetupUrl}
              entityLabel={entityLabel}
              onRegister={redirectToSonarLogin}
              onSignOut={handleSignOut}
              onRefresh={handleRefresh}
            />
          </div>
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
            <span className="status-pill">Ended</span>
            {finalMetrics(commitment).map((c) => (
              <MetricCell key={c.label} metric={c} />
            ))}
          </div>
          {expanded ? (
            <CloseButton className="ml-auto" onClick={() => setExpanded(false)} />
          ) : (
            <Cta
              variant="solid"
              arrow
              className="ml-auto"
              onClick={() => setExpanded(true)}
              buttonRef={triggerRef}
              ariaExpanded={expanded}
            >
              <span>View results</span>
            </Cta>
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
                className={`bid-capsule max-h-[60vh] overflow-y-auto overscroll-contain px-6 py-5 transition-opacity duration-500 ease-reveal focus:outline-none motion-reduce:transition-none ${
                  expanded ? "opacity-100" : "opacity-0"
                }`}
              >
                <SettlementFlow
                  clearingPriceUsd={commitment.clearingPriceUsd}
                  myBid={myBid}
                  onClaim={claim.claim}
                  gate={claimGate.data}
                />
              </div>
            </div>
          </div>
        </div>
      </BarShell>
    )
  }

  const metrics = liveMetrics(commitment, pendingBidDelta)

  // The journey reads missing data as "unverified"/"no bid", so rendering it before the reads
  // settle would flash a false status (reconnect prompt, "place your bid") on every load. Hold a
  // neutral skeleton until the claims are backed by data; the position read only matters once the
  // journey needs it (its query is disabled until the wallet connects).
  const positionRelevant =
    journey === "ready" ||
    journey === "has-bid-winning" ||
    journey === "has-bid-outbid" ||
    journey === "has-bid-pending"
  const statusResolved = entityResolved && (!positionRelevant || positionResolved)

  return (
    <aside aria-label="Bid panel" data-component="bid-panel" className={SHELL}>
      <div ref={cardRef} className={CARD}>
        <div className="bar-content-enter grid grid-cols-12 gap-6 px-6 lg:px-0">
          <Entrance className="band-10">
            <DrawLine immediate delayMs={200} />
            <div className="py-4 sm:py-6">
              <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
                <Stagger
                  as="div"
                  immediate
                  delayMs={900}
                  className={`flex flex-wrap items-start ${
                    expanded ? "gap-x-5 gap-y-2 sm:gap-x-7" : "gap-5 gap-y-2 xl:gap-7"
                  }`}
                >
                  {metrics.map((m, i) => (
                    <div
                      key={m.label}
                      className={`flex items-start ${
                        expanded ? "gap-x-5 sm:gap-x-7" : "gap-5 xl:gap-7"
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
                              expanded ? "text-lg" : "text-2xl xl:text-3xl"
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
                </Stagger>

                <div className="ml-auto flex flex-wrap items-center justify-end gap-3 sm:gap-4">
                  {expanded ? (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      {statusResolved ? (
                        <FunnelSteps journey={journey} />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="hidden h-4 w-56 animate-pulse rounded-full bg-border motion-reduce:animate-none xl:block"
                        />
                      )}
                      <CloseButton onClick={() => setExpanded(false)} />
                    </div>
                  ) : (
                    <span ref={ctaRef} className="inline-flex">
                      <Cta
                        variant="solid"
                        arrow
                        onClick={() => setExpanded(true)}
                        buttonRef={triggerRef}
                        ariaExpanded={expanded}
                      >
                        <span data-cta-label className="inline-flex items-center gap-2">
                          <BidStatusTag journey={journey} />
                          <span>{bidCtaLabel(journey)}</span>
                        </span>
                      </Cta>
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
              onTransitionEnd={(e) => {
                if (
                  e.target === e.currentTarget &&
                  e.propertyName === "grid-template-rows" &&
                  !expanded
                ) {
                  setBidFlowEpoch((n) => n + 1)
                }
              }}
            >
              <div className="overflow-hidden">
                <div className="pb-4 sm:pb-6">
                  <div
                    ref={panelRef}
                    tabIndex={-1}
                    inert={!expanded}
                    className={`bid-capsule max-h-[60vh] overflow-y-auto overscroll-contain px-6 py-5 transition-opacity duration-500 ease-reveal focus:outline-none motion-reduce:transition-none ${
                      expanded ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {statusResolved ? (
                      <>
                        {isConnected ? (
                          <BidSectionHeader
                            journey={journey}
                            myBid={myBid}
                            clearingPriceUsd={commitment.clearingPriceUsd}
                            wallet={<WalletButton />}
                            manageEntitiesHref={sonarSetupUrl}
                            entityLabel={entityLabel}
                          />
                        ) : null}
                        <BidFlow
                          key={bidFlowEpoch}
                          journey={journey}
                          returning={sonarSeen}
                          clearingPriceUsd={commitment.clearingPriceUsd}
                          myBid={myBid}
                          onConnectSonar={redirectToSonarLogin}
                          onSignOut={handleSignOut}
                          setupHref={sonarSetupUrl}
                          onBid={bid.submit}
                          onRaise={() => setBidFlowEpoch((n) => n + 1)}
                          onPrecheck={precheck}
                          active={expanded}
                          entityLabel={entityLabel}
                        />
                      </>
                    ) : (
                      <BidPanelSkeleton />
                    )}
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

// wallet: live WalletButton, or a static chip in dev fixtures.
/** The active Sonar entity as a quiet underlined link out to Sonar account management
 *  (add a business entity, switch, finish setup). Not a pill: that shape belongs to the
 *  wallet. Label = user's own PII, shown only to them. */
export function ManageEntityLink({ href, label }: { href: string; label?: string | null }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title="Manage your Sonar account"
      aria-label="Manage your Sonar account"
      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted transition-colors hover:text-foreground"
    >
      <Icon name="shield-check" draw={false} className="h-3.5 w-3.5 shrink-0" />
      <span className="max-w-[18ch] truncate underline underline-offset-2">
        {label ?? "Sonar account"}
      </span>
      {/* Inline SVG, not the U+2197 glyph: some Windows fonts promote it to emoji. */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-3 w-3 shrink-0"
        aria-hidden="true"
      >
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    </a>
  )
}

export function BidSectionHeader({
  journey,
  myBid,
  clearingPriceUsd,
  wallet,
  manageEntitiesHref,
  entityLabel,
}: {
  journey: JourneyState
  myBid: MyBid
  clearingPriceUsd: number | null
  wallet: ReactNode
  /** Sonar-hosted entity management (add a business entity, finish setup); opens in a new tab. */
  manageEntitiesHref?: string
  entityLabel?: string | null
}) {
  const hasBid =
    journey === "has-bid-winning" || journey === "has-bid-outbid" || journey === "has-bid-pending"
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-3">
      {hasBid && myBid ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="mr-3 text-sm font-semibold tracking-tight text-foreground">
            Your bid
          </span>
          <HeaderCell label="Committed" value={fmtUsd(myBid.committedUsd)} />
          <HeaderCell label="Your max price" value={`${fmtPrice(myBid.priceUsd)} / GNOT`} />
          <HeaderCell
            label="Est. allocation"
            value={`~${fmtGnot(gnotEstimate(myBid.committedUsd, clearingPriceUsd))} GNOT`}
          />
          <HeaderCell
            label="Current status"
            value={
              journey === "has-bid-pending"
                ? "Pending"
                : journey === "has-bid-winning"
                  ? "Winning"
                  : "Outbid"
            }
            tone={
              journey === "has-bid-pending"
                ? undefined
                : journey === "has-bid-winning"
                  ? "ok"
                  : "warn"
            }
          />
        </div>
      ) : (
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {bidSectionTitle(journey)}
        </span>
      )}
      <div className="flex items-center gap-6">
        {manageEntitiesHref ? (
          <ManageEntityLink href={manageEntitiesHref} label={entityLabel} />
        ) : null}
        {wallet}
      </div>
    </div>
  )
}

function HeaderCell({
  label,
  value,
  tone,
}: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</p>
      <p
        className={`mt-0.5 font-mono text-sm tabular-nums ${
          tone === "ok" ? "text-mint" : tone === "warn" ? "text-amber" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  )
}

// Neutral placeholder shown while the entity/position reads settle - the panel must not claim
// "verify"/"reconnect"/"place your bid" before the data backs it. Mirrors the panel's layout
// (header row + input row) so the resolve does not shift the bar's height.
function BidPanelSkeleton() {
  return (
    <div aria-busy="true" className="animate-pulse motion-reduce:animate-none">
      <div className="mb-4 flex items-center justify-between gap-x-6 border-b border-border pb-3">
        <div className="h-5 w-44 rounded-md bg-border" />
        <div className="h-9 w-36 rounded-full bg-border" />
      </div>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div className="h-12 w-40 rounded-[var(--radius-md)] bg-border" />
        <div className="h-12 w-48 rounded-[var(--radius-md)] bg-border" />
        <div className="h-12 w-44 rounded-[var(--radius-md)] bg-border" />
        <div className="ml-auto h-12 w-36 rounded-full bg-border" />
      </div>
    </div>
  )
}

function RefreshButton({ onRefresh }: { onRefresh: () => void | Promise<void> }) {
  const [pending, setPending] = useState(false)
  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={async () => {
        setPending(true)
        try {
          await onRefresh()
        } finally {
          setPending(false)
        }
      }}
      className="text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-60"
    >
      {pending ? "Refreshing…" : "Refresh"}
    </button>
  )
}

function StatusRow({
  icon,
  tone = "default",
  title,
  body,
  action,
  manage,
  onSignOut,
  onRefresh,
  withCalendar = false,
  contactHref,
}: {
  icon: string
  tone?: "default" | "danger" | "ok"
  title: string
  body?: string
  action?: ReactNode
  /** The entity manage link, shown across every KYC state that has a Sonar entity. */
  manage?: ReactNode
  onSignOut: () => void
  onRefresh?: () => void | Promise<void>
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
        {onRefresh ? <RefreshButton onRefresh={onRefresh} /> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {manage}
        {action}
        {withCalendar ? <AddToCalendarButton milestone="sale" variant="bar" /> : null}
      </div>
    </div>
  )
}

export function PreSaleRight({
  state,
  returning,
  setupHref,
  entityLabel,
  onRegister = () => {},
  onSignOut = () => {},
  onRefresh = () => {},
}: {
  state: PreSaleBarState
  returning: boolean
  setupHref: string
  entityLabel?: string | null
  onRegister?: () => void
  onSignOut?: () => void
  onRefresh?: () => void | Promise<void>
}) {
  switch (state) {
    case "notify":
      return newsletterEnabled() ? (
        <div className="flex flex-wrap items-center gap-5">
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
          <Cta variant="solid" arrow onClick={onRegister}>
            <span>{WELCOME_BACK.cta}</span>
          </Cta>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="text-sm text-muted">Registration is open</p>
          <Cta variant="solid" arrow onClick={onRegister}>
            <span>Register now</span>
          </Cta>
        </div>
      )
    case "incomplete":
      return (
        <StatusRow
          icon={VERIFY_INCOMPLETE.icon}
          title={`${VERIFY_INCOMPLETE.title}.`}
          action={
            <Cta variant="solid" arrow href={setupHref} external>
              <span>{VERIFY_INCOMPLETE.cta}</span>
            </Cta>
          }
          onSignOut={onSignOut}
        />
      )
    case "pending":
      return (
        <StatusRow
          icon={VERIFY_STATUS.pending.icon}
          tone={VERIFY_STATUS.pending.tone}
          title={`${VERIFY_STATUS.pending.title}.`}
          body={VERIFY_STATUS.pending.body}
          manage={<ManageEntityCta href={setupHref} label={entityLabel} />}
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
          manage={<ManageEntityCta href={setupHref} label={entityLabel} />}
          onSignOut={onSignOut}
          withCalendar
          contactHref={SUPPORT_VERIFY_FAILED_HREF ?? undefined}
        />
      )
    case "not-eligible":
      return (
        <StatusRow
          icon={VERIFY_STATUS["not-eligible"].icon}
          tone={VERIFY_STATUS["not-eligible"].tone}
          title={`${VERIFY_STATUS["not-eligible"].title}.`}
          body={VERIFY_STATUS["not-eligible"].body}
          manage={<ManageEntityCta href={setupHref} label={entityLabel} />}
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
          body="Nothing more to do until the sale opens."
          manage={<ManageEntityCta href={setupHref} label={entityLabel} />}
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
          <Cta variant="solid" arrow onClick={onRegister}>
            <span>Try again</span>
          </Cta>
        </div>
      )
    default:
      return state satisfies never
  }
}
