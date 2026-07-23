"use client"

import { track } from "@/lib/analytics/track"
import { useCtaEntrance } from "@/lib/motion/use-motion"
import { redirectToSonarLogin } from "@/lib/sale/api"
import { gnotEstimate } from "@/lib/sale/calc"
import { SALE_ECONOMICS, formatSaleDate } from "@/lib/sale/economics"
import { fmtGnot, fmtPrice, fmtUsd, pendingCommittedChip } from "@/lib/sale/format"
import { useBid, useBidPrecheck, useClaim, useClaimGate } from "@/lib/sale/hooks"
import { derivePreSaleBar } from "@/lib/sale/journey"
import { type SaleTranslator, bidCtaLabel, bidSectionTitle } from "@/lib/sale/labels"
import { useSonarSeen } from "@/lib/sale/returning"
import type { JourneyState, MyBid } from "@/lib/sale/types"
import { useLocale, useTranslations } from "next-intl"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { useAccount } from "wagmi"
import { BidFlow } from "../(sections)/bid/BidFlow"
import { TierBonusMeter } from "../(sections)/bid/BonusNote"
import { BidStatusTag, FunnelSteps } from "../(sections)/bid/FunnelSteps"
import { SonarSignOutButton } from "../(sections)/bid/ManageEntity"
import { SettlementFlow } from "../(sections)/bid/SettlementFlow"
import { CloseButton } from "../(ui)/CloseButton"
import { Cta } from "../(ui)/Cta"
import { DrawLine } from "../(ui)/DrawLine"
import { Entrance } from "../(ui)/Entrance"
import { Icon } from "../(ui)/Icon"
import { Stagger } from "../(ui)/Stagger"
import {
  BarCountdown,
  BarShell,
  CARD,
  MetricCell,
  MetricPendingChip,
  SHELL,
  finalMetrics,
  liveMetrics,
  useBarGrow,
} from "./BidBarShell"
import { PreSaleRight, useSonarSessionActions } from "./PreSaleBar"
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
  const t = useTranslations("BidPanel")
  const tSale = useTranslations("Sale")
  const locale = useLocale()
  const bid = useBid()
  const { precheck } = useBidPrecheck()
  const claim = useClaim()
  const claimGate = useClaimGate({ enabled: phase === "ended" })
  const sonarSeen = useSonarSeen()
  const { isConnected } = useAccount()
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

  const { signOut: handleSignOut, refresh: handleRefresh } = useSonarSessionActions()

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
        {/* Banner sits inside the same padded block as the row (mirrors the live bar), so the
            vertical rhythm matches; its own mb-3 spaces it from the row below. */}
        <div className="py-4 sm:py-6">
          <TierBonusMeter cumulativeUsd={commitment.totalCommittedUsd} />
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <BarCountdown
              targetIso={
                countToSale ? SALE_ECONOMICS.saleOpensIso : SALE_ECONOMICS.registrationOpensIso
              }
              caption={
                countToSale
                  ? t("captionOpens", {
                      date: formatSaleDate(SALE_ECONOMICS.saleOpensIso, true, locale),
                    })
                  : t("captionRegistrationOpens", {
                      date: formatSaleDate(SALE_ECONOMICS.registrationOpensIso, false, locale),
                    })
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
            <span className="status-pill">{t("statusEnded")}</span>
            {finalMetrics(t as unknown as SaleTranslator, commitment).map((c) => (
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
              <span>{t("viewResults")}</span>
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
                className={`bid-capsule max-h-[60vh] overflow-y-auto overscroll-none px-6 py-5 transition-opacity duration-500 ease-reveal focus:outline-none motion-reduce:transition-none ${
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

  const metrics = liveMetrics(
    t as unknown as SaleTranslator,
    commitment,
    pendingBidDelta
      ? pendingCommittedChip(pendingBidDelta.amountUsd, tSale as unknown as SaleTranslator)
      : undefined,
    expanded,
  )

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
    <aside aria-label={t("bidPanelAria")} data-component="bid-panel" className={SHELL}>
      <div ref={cardRef} className={CARD}>
        <div className="bar-content-enter grid grid-cols-12 gap-6 px-6 lg:px-0">
          <Entrance className="band-10">
            <DrawLine immediate delayMs={200} />
            <div className="py-4 sm:py-6">
              {/* Tiered-bonus tier bar in the white header area, above the metrics - the single bonus
                  surface for the live panel (schedule + current position, no per-bid math). */}
              <TierBonusMeter cumulativeUsd={commitment.totalCommittedUsd} />
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
                          <span>{bidCtaLabel(tSale as unknown as SaleTranslator, journey)}</span>
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
                    className={`bid-capsule max-h-[60vh] overflow-y-auto overscroll-none px-6 py-5 transition-opacity duration-500 ease-reveal focus:outline-none motion-reduce:transition-none ${
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
                            onSignOut={handleSignOut}
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
export function ManageEntityLink({
  href,
  label,
  onSignOut,
}: { href: string; label?: string | null; onSignOut?: () => void }) {
  const t = useTranslations("BidPanel")
  return (
    // Wider than the link's internal gap (two distinct controls) yet far tighter than the gap-6
    // to the wallet chip, so label + power still read as one account cluster.
    <span className="inline-flex items-center gap-2.5 font-mono text-[11px]">
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        title={t("manageSonarAria")}
        aria-label={t("manageSonarAria")}
        className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
      >
        <Icon name="shield-check" draw={false} className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[18ch] truncate underline underline-offset-2">
          {label ?? t("mySonarAccount")}
        </span>
        {onSignOut ? null : (
          // Inline SVG, not the U+2197 glyph: some Windows fonts promote it to emoji.
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
        )}
      </a>
      {onSignOut ? <SonarSignOutButton onSignOut={onSignOut} variant="bare" /> : null}
    </span>
  )
}

export function BidSectionHeader({
  journey,
  myBid,
  clearingPriceUsd,
  wallet,
  manageEntitiesHref,
  entityLabel,
  onSignOut = () => {},
}: {
  journey: JourneyState
  myBid: MyBid
  clearingPriceUsd: number | null
  wallet: ReactNode
  /** Sonar-hosted entity management (add a business entity, finish setup); opens in a new tab. */
  manageEntitiesHref?: string
  entityLabel?: string | null
  onSignOut?: () => void
}) {
  const t = useTranslations("BidPanel")
  const tSale = useTranslations("Sale")
  const hasBid =
    journey === "has-bid-winning" || journey === "has-bid-outbid" || journey === "has-bid-pending"
  // The header must not offer to end a Sonar session that does not exist: kyc-required is the
  // pre-OAuth ask, wrong-network hides everything but the switch prompt. Without a handler the
  // manage link keeps its external arrow instead.
  const sessionless =
    journey === "disconnected" || journey === "kyc-required" || journey === "wrong-network"
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-3">
      {hasBid && myBid ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="mr-3 text-sm font-semibold tracking-tight text-foreground">
            {t("yourBid")}
          </span>
          <HeaderCell label={t("labelCommitted")} value={fmtUsd(myBid.committedUsd)} />
          <HeaderCell label={t("headerMaxPrice")} value={`${fmtPrice(myBid.priceUsd)} / GNOT`} />
          <HeaderCell
            label={t("headerAllocation")}
            value={`~${fmtGnot(gnotEstimate(myBid.committedUsd, clearingPriceUsd))} GNOT`}
          />
          <HeaderCell
            label={t("headerStatus")}
            value={
              journey === "has-bid-pending"
                ? t("statusPending")
                : journey === "has-bid-winning"
                  ? t("statusWinning")
                  : t("statusOutbid")
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
          {bidSectionTitle(tSale as unknown as SaleTranslator, journey)}
        </span>
      )}
      <div className="flex items-center gap-6">
        {manageEntitiesHref ? (
          <ManageEntityLink
            href={manageEntitiesHref}
            label={entityLabel}
            onSignOut={sessionless ? undefined : onSignOut}
          />
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
