"use client"

import { LG_MEDIA_QUERY } from "@/lib/device/breakpoints"
import { useMediaQuery } from "@/lib/device/use-media-query"
import { shouldAnimate } from "@/lib/motion/should-animate"
import { SALE_ECONOMICS } from "@/lib/sale/economics"
import { fmtCompactUsd, fmtCount, fmtPrice } from "@/lib/sale/format"
import type { SaleTranslator } from "@/lib/sale/labels"
import type { CommitmentData } from "@/lib/sale/types"
import { useTranslations } from "next-intl"
import { type ReactNode, useEffect, useRef } from "react"
import { DrawLine } from "../(ui)/DrawLine"
import { Icon } from "../(ui)/Icon"
import { Countdown } from "./Countdown"

export const SHELL =
  "bar-enter fixed bottom-[var(--reveal-padding)] left-[var(--reveal-padding)] right-[var(--reveal-padding)] z-[var(--z-sticky)]"
export const CARD =
  "overflow-hidden rounded-[var(--frame-radius)] bg-background lg:mx-auto lg:max-w-[calc(var(--max-width-container)_-_4rem)] lg:rounded-b-none"

const BAR_GROW_INSET = 4.25
const BAR_GROW_PX = 300

export function useBarGrow<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const wide = useMediaQuery(LG_MEDIA_QUERY)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!shouldAnimate() || !wide) {
      el.style.clipPath = ""
      return
    }
    const scroller = document.querySelector<HTMLElement>(".screen") ?? document.documentElement
    let raf = 0
    const apply = () => {
      raf = 0
      const p = Math.min(scroller.scrollTop / BAR_GROW_PX, 1)
      const x = (BAR_GROW_INSET * (1 - p)).toFixed(3)
      el.style.clipPath = `inset(0 ${x}% 0 ${x}% round var(--frame-radius) var(--frame-radius) 0 0)`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    apply()
    scroller.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      scroller.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
      el.style.clipPath = ""
    }
  }, [wide])
  return ref
}

export type BarMetric = { icon: string; value: ReactNode; label: string; pending?: string }

/** The single renderer for a metric's pending chip; keep every render site on this component.
 *  A grey capsule INLINE after the label, capped below the label's line-height: appearing or
 *  vanishing on refresh must never move the layout (no new line, no row growth). */
export function MetricPendingChip({ label }: { label: string }) {
  const t = useTranslations("Sale")
  return (
    <span
      title={t("pendingChipHint")}
      className="ml-2 inline-block rounded-full bg-surface-alt px-2 align-middle font-mono text-[8px] normal-case leading-[14px] tracking-normal tabular-nums text-foreground"
    >
      {label}
    </span>
  )
}

export function BarShell({ children }: { children: ReactNode }) {
  const t = useTranslations("BidPanel")
  const cardRef = useBarGrow<HTMLDivElement>()
  return (
    <aside aria-label={t("bidPanelAria")} data-component="bid-panel" className={SHELL}>
      <div ref={cardRef} className={CARD}>
        <div className="bar-content-enter grid grid-cols-12 gap-6 px-6 lg:px-0">
          <div className="band-10">{children}</div>
        </div>
      </div>
    </aside>
  )
}

export function BarStatus({
  icon,
  title,
  body,
  tone = "default",
}: {
  icon: string
  title: string
  body?: string
  tone?: "default" | "danger" | "ok"
}) {
  const iconColor =
    tone === "danger" ? "text-danger" : tone === "ok" ? "text-mint" : "text-foreground"
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} draw={false} className={`h-5 w-5 shrink-0 ${iconColor}`} />
      <p className="text-sm">
        <span className="font-medium text-foreground">{title}</span>
        {body ? <span className="ml-1.5 text-muted">{body}</span> : null}
      </p>
    </div>
  )
}

export function MetricCell({
  metric,
  compact = false,
  className = "",
}: { metric: BarMetric; compact?: boolean; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {compact ? null : <Icon name={metric.icon} draw={false} className="h-[18px] w-[18px]" />}
        <p className="font-mono text-lg font-medium tracking-tight tabular-nums">{metric.value}</p>
      </div>
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
        {metric.label}
        {metric.pending ? <MetricPendingChip label={metric.pending} /> : null}
      </p>
    </div>
  )
}

export function BarCountdown({ targetIso, caption }: { targetIso: string; caption: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon name="clock" draw={false} className="h-[18px] w-[18px]" />
      <div>
        <p className="font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
          <Countdown targetIso={targetIso} label={caption} />
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">{caption}</p>
      </div>
    </div>
  )
}

/** `t` is a BidPanel-namespace translator; `pendingChip` is a pre-formatted "+$x pending" string
 *  built by the caller (its " pending" word lives in the Sale namespace). */
export function liveMetrics(
  t: SaleTranslator,
  commitment: CommitmentData,
  pendingChip?: string,
): BarMetric[] {
  return [
    {
      icon: "clearing",
      value: commitment.clearingPriceUsd ? fmtPrice(commitment.clearingPriceUsd) : t("tbd"),
      label: t("labelClearing"),
    },
    {
      icon: "clock",
      value: <Countdown targetIso={SALE_ECONOMICS.saleClosesIso} label={t("labelTimeLeft")} />,
      label: t("labelTimeLeft"),
    },
    {
      icon: "users-group",
      value: fmtCount(commitment.uniqueCommitmentCount),
      label: t("labelBidders"),
      // No pending chip here: only the last metric (Committed) may carry one, so its appearance
      // or disappearance on refresh never shifts a neighbour.
    },
    {
      icon: "database",
      value: fmtCompactUsd(commitment.totalCommittedUsd),
      label: t("labelCommitted"),
      pending: pendingChip,
    },
  ]
}

export function liveKeyMetrics(t: SaleTranslator, commitment: CommitmentData): BarMetric[] {
  return [
    {
      icon: "clearing",
      value: commitment.clearingPriceUsd ? fmtPrice(commitment.clearingPriceUsd) : t("tbd"),
      label: t("labelClearing"),
    },
    {
      icon: "clock",
      value: (
        <Countdown
          targetIso={SALE_ECONOMICS.saleClosesIso}
          seconds={false}
          label={t("labelTimeLeft")}
        />
      ),
      label: t("labelTimeLeft"),
    },
    {
      icon: "database",
      value: fmtCompactUsd(commitment.totalCommittedUsd),
      label: t("labelRaised"),
    },
  ]
}

export function finalMetrics(t: SaleTranslator, commitment: CommitmentData): BarMetric[] {
  return [
    {
      icon: "clearing",
      value: fmtPrice(commitment.clearingPriceUsd ?? 0),
      label: t("labelFinalPrice"),
    },
    {
      icon: "database",
      value: fmtCompactUsd(commitment.totalCommittedUsd),
      label: t("labelRaised"),
    },
    {
      icon: "users-group",
      value: fmtCount(commitment.uniqueCommitmentCount),
      label: t("labelBidders"),
    },
  ]
}

export function PausedBar() {
  const t = useTranslations("BidPanel")
  return (
    <BarShell>
      <DrawLine immediate />
      <div className="flex flex-wrap items-center gap-3 py-4 sm:py-6">
        <Icon name="clock" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
        <p className="text-sm">
          <span className="font-medium text-foreground">{t("pausedTitle")}</span>{" "}
          <span className="text-muted">{t("pausedBody")}</span>
        </p>
      </div>
    </BarShell>
  )
}
