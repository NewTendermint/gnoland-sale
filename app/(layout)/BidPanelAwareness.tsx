"use client"

/**
 * Awareness-only sticky bar (touch devices or < lg viewports; see
 * docs/specs/2026-06-13-mobile-awareness-only-design.md). Read-only by design:
 * no funnel CTA, no expansion, no wallet, no Sonar. Every phase is two lines: line 1
 * the key figures (countdown, or the live / final metrics on a single row), line 2 the
 * full-width action (pre-sale capture row) or a short desktop pointer (DESKTOP_ONLY copy).
 * The body is prop-driven and exported so the /dev/states harness can render every phase
 * inline without the fixed shell.
 */
import { DrawLine } from "../(ui)/DrawLine"
import { newsletterEnabled } from "../../lib/newsletter/config"
import { SALE_ECONOMICS, formatSaleDate } from "../../lib/sale/economics"
import { DESKTOP_ONLY } from "../../lib/sale/labels"
import type { CommitmentData, PreSaleStage, SalePhase } from "../../lib/sale/types"
import { AddToCalendarButton } from "./AddToCalendarButton"
import {
  BarCountdown,
  BarShell,
  BarStatus,
  MetricCell,
  finalMetrics,
  liveKeyMetrics,
} from "./BidBarShell"
import { NewsletterForm } from "./NewsletterForm"
import { useSale } from "./SaleProvider"

export function BidPanelAwareness() {
  const { phase, preSaleStage, commitment } = useSale()
  return (
    <BarShell>
      <DrawLine immediate />
      <AwarenessBarBody phase={phase} preSaleStage={preSaleStage} commitment={commitment} />
    </BarShell>
  )
}

export function AwarenessBarBody({
  phase,
  preSaleStage,
  commitment,
}: {
  phase: SalePhase
  preSaleStage: PreSaleStage
  commitment: CommitmentData
}) {
  if (phase === "pre-sale") {
    const registrationOpen = preSaleStage === "registration-open"
    return (
      <div className="flex flex-col gap-4 pb-5 pt-4 sm:pb-6 sm:pt-5">
        {/* Line 1: countdown to the next milestone (the key figure). */}
        <BarCountdown
          targetIso={
            registrationOpen ? SALE_ECONOMICS.saleOpensIso : SALE_ECONOMICS.registrationOpensIso
          }
          caption={
            registrationOpen
              ? `Opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}`
              : `Registration opens ${formatSaleDate(SALE_ECONOMICS.registrationOpensIso, false)}`
          }
        />
        {/* Line 2: the action, full width. Registration (Sonar OAuth) is desktop-only,
            so that stage shows the short desktop pointer + calendar; before it, the
            capture row (notify email + calendar). */}
        {registrationOpen ? (
          // Registration (Sonar OAuth) is desktop-only, and unlike the live / ended
          // titles, "Registration is open" alone never says so - keep the body, which
          // is the desktop pointer, so a mobile visitor knows where to act.
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <BarStatus
              icon="shield-check"
              title={`${DESKTOP_ONLY.register.title}.`}
              body={DESKTOP_ONLY.register.body}
            />
            <AddToCalendarButton milestone="sale" variant="bar" />
          </div>
        ) : newsletterEnabled() ? (
          <div className="flex w-full flex-wrap items-start gap-3">
            <NewsletterForm variant="bar" inputId="newsletter-email-bar" />
            <AddToCalendarButton milestone="registration" variant="bar" />
          </div>
        ) : (
          // Feature intentionally off: state the next date, no dead CTA.
          <p className="text-sm text-muted">{`Sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}`}</p>
        )}
      </div>
    )
  }

  if (phase === "ended") {
    return (
      <div className="flex flex-col gap-3 pb-5 pt-4 sm:pb-6 sm:pt-5">
        {/* Line 1: Closed + the key final figures (price + raised), one row. */}
        <div className="flex items-center">
          <span className="status-pill">Closed</span>
          {finalMetrics(commitment)
            .slice(0, 2)
            .map((c) => (
              <MetricCell
                key={c.label}
                compact
                metric={c}
                className="ml-3 border-l border-border pl-3 min-[360px]:ml-5 min-[360px]:pl-5"
              />
            ))}
        </div>
        {/* Line 2: short desktop pointer (no action: bidding is closed). */}
        <BarStatus icon="shield-check" title={`${DESKTOP_ONLY.ended.title}.`} />
      </div>
    )
  }

  // Live: the three key public figures on one line (read-only), then a short
  // desktop pointer. No bid CTA - bidding is desktop-only.
  return (
    <div className="flex flex-col gap-3 pb-5 pt-4 sm:pb-6 sm:pt-5">
      <div className="flex items-stretch">
        {liveKeyMetrics(commitment).map((m, i) => (
          <MetricCell
            key={m.label}
            compact
            metric={m}
            className={
              i > 0 ? "ml-3 border-l border-border pl-3 min-[360px]:ml-5 min-[360px]:pl-5" : ""
            }
          />
        ))}
      </div>
      <BarStatus icon="shield-check" title={`${DESKTOP_ONLY.live.title}.`} />
    </div>
  )
}
