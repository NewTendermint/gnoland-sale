"use client"

import { type SaleTranslator, desktopOnly } from "@/lib/sale/labels"
import type { CommitmentData, SalePhase } from "@/lib/sale/types"
import { useTranslations } from "next-intl"
import { FirstDayBonusBanner } from "../(sections)/bid/BonusNote"
import { DrawLine } from "../(ui)/DrawLine"
import { BarShell, BarStatus, MetricCell, finalMetrics, liveKeyMetrics } from "./BidBarShell"
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
  const t = useTranslations("BidPanel")
  const tSale = useTranslations("Sale")
  const desktop = desktopOnly(tSale as unknown as SaleTranslator)
  if (phase === "ended") {
    return (
      <div className="flex flex-col gap-3 py-4 sm:py-5">
        <div className="flex items-center">
          <span className="status-pill">{t("statusEnded")}</span>
          {finalMetrics(t as unknown as SaleTranslator, commitment)
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
        <BarStatus icon="shield-check" title={`${desktop.ended.title}.`} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 py-4 sm:py-5">
      <FirstDayBonusBanner />
      <div className="flex items-stretch">
        {liveKeyMetrics(t as unknown as SaleTranslator, commitment).map((m, i) => (
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
      <BarStatus icon="shield-check" title={`${desktop.live.title}.`} />
    </div>
  )
}
