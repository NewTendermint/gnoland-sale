"use client"

import type { JourneyState } from "@/lib/sale/types"
import { useTranslations } from "next-intl"

const FUNNEL: { labelKey: string; states: JourneyState[] }[] = [
  {
    labelKey: "funnelVerify",
    states: ["kyc-required", "kyc-incomplete", "kyc-pending", "kyc-failed", "not-eligible"],
  },
  { labelKey: "funnelConnect", states: ["disconnected", "wrong-network"] },
  {
    labelKey: "funnelBid",
    states: ["ready", "has-bid-winning", "has-bid-outbid", "has-bid-pending"],
  },
]

export function FunnelSteps({
  journey,
  terminal = "bid",
}: { journey: JourneyState; terminal?: "bid" | "claim" }) {
  const t = useTranslations("Bid")
  const current = FUNNEL.findIndex((s) => s.states.includes(journey))
  return (
    // Hidden below xl: at narrow widths the steps are context the header cannot afford.
    <ol className="hidden items-center gap-x-2.5 gap-y-2 xl:flex">
      {FUNNEL.map((step, i) => {
        const phase = i < current ? "done" : i === current ? "current" : "upcoming"
        // Same funnel, ended-phase terminal reads "Claim" instead of "Bid".
        const labelKey =
          terminal === "claim" && i === FUNNEL.length - 1 ? "funnelClaim" : step.labelKey
        return (
          <li key={step.labelKey} className="flex items-center gap-2.5">
            {i > 0 ? (
              <span className={`h-px w-4 ${i <= current ? "bg-foreground" : "bg-border"}`} />
            ) : null}
            <span className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium tabular-nums ${
                  phase === "current"
                    ? "border-foreground bg-foreground text-background"
                    : phase === "done"
                      ? "border-foreground text-foreground"
                      : "border-border text-faint"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
                  phase === "upcoming" ? "text-faint" : "text-foreground"
                }`}
              >
                {t(labelKey)}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function BidStatusTag({ journey }: { journey: JourneyState }) {
  const t = useTranslations("Bid")
  if (journey === "has-bid-winning") {
    return (
      <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-mint">
        {t("tagWinning")}
      </span>
    )
  }
  if (journey === "has-bid-outbid") {
    return (
      <span className="rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-amber">
        {t("tagOutbid")}
      </span>
    )
  }
  if (journey === "has-bid-pending") {
    // Neutral outline; on-contrast tokens because this tag only renders inside the solid CTA,
    // whose btn-pan hover slides the pill light - the tag must flip to foreground with it or it
    // reads white-on-white mid-hover.
    return (
      <span className="rounded-full border border-on-contrast/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-contrast transition-colors group-hover:border-foreground/40 group-hover:text-foreground">
        {t("tagPending")}
      </span>
    )
  }
  return null
}
