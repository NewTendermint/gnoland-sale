"use client"

import { redirectToSonarLogin } from "@/lib/sale/api"
import { derivePreSaleBar } from "@/lib/sale/journey"
import { type SaleTranslator, desktopOnly } from "@/lib/sale/labels"
import { useSonarSeen } from "@/lib/sale/returning"
import type { CommitmentData, SalePhase } from "@/lib/sale/types"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { TierBonusMeter } from "../(sections)/bid/BonusNote"
import { DrawLine } from "../(ui)/DrawLine"
import { BarShell, BarStatus, MetricCell, finalMetrics, liveKeyMetrics } from "./BidBarShell"
import { PreSaleRight, useSonarSessionActions } from "./PreSaleBar"
import { useSale } from "./SaleProvider"

// Mobile bar for the live and ended phases (pre-sale is handled by PreSaleBarMobile). During live it
// shows the registration/KYC funnel until the user is verified, then only the desktop-only note;
// bidding is always desktop-only. Ended has nothing left to register for.
export function BidPanelAwareness() {
  const { phase, commitment, preSaleStage, journey, sonarReturn, sonarSetupUrl, entityLabel } =
    useSale()
  const sonarSeen = useSonarSeen()
  const { signOut, refresh } = useSonarSessionActions()
  const barState = derivePreSaleBar(preSaleStage, journey, sonarReturn)
  const kycFunnel =
    phase === "live" && barState !== "registered" ? (
      <PreSaleRight
        state={barState}
        returning={sonarSeen}
        setupHref={sonarSetupUrl}
        entityLabel={entityLabel}
        compact
        onRegister={redirectToSonarLogin}
        onSignOut={signOut}
        onRefresh={refresh}
      />
    ) : null
  return (
    <BarShell>
      <DrawLine immediate />
      <AwarenessBarBody phase={phase} commitment={commitment} kycFunnel={kycFunnel} />
    </BarShell>
  )
}

function AwarenessBarBody({
  phase,
  commitment,
  kycFunnel,
}: {
  phase: SalePhase
  commitment: CommitmentData
  /** Identity-verification funnel rendered under the live bar (mobile KYC); absent when ended. */
  kycFunnel?: ReactNode
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
      <TierBonusMeter cumulativeUsd={commitment.totalCommittedUsd} />
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
      {/* Before verification: the KYC funnel. Once verified it is null, falling back to the note. */}
      {kycFunnel ?? <BarStatus icon="shield-check" title={`${desktop.live.title}.`} />}
    </div>
  )
}
