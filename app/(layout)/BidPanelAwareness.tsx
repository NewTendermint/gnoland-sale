"use client"

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

// Pre-sale is NOT handled here anymore: mobile serves the real registration funnel during
// pre-sale (PreSaleBarMobile); this bar only covers the live and ended phases.
export function BidPanelAwareness() {
  const { phase, commitment } = useSale()
  return (
    <BarShell>
      <DrawLine immediate />
      <AwarenessBarBody phase={phase} commitment={commitment} />
    </BarShell>
  )
}

export function AwarenessBarBody({
  phase,
  commitment,
}: {
  phase: SalePhase
  commitment: CommitmentData
}) {
  if (phase === "ended") {
    return (
      <div className="flex flex-col gap-3 py-4 sm:py-5">
        <div className="flex items-center">
          <span className="status-pill">Ended</span>
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
        <BarStatus icon="shield-check" title={`${DESKTOP_ONLY.ended.title}.`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4 sm:py-5">
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
