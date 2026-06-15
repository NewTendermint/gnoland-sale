"use client"

/**
 * Shared sticky-bar primitives for the two BidPanel variants (desktop funnel /
 * awareness read-only): the fixed shell geometry, the card surface, the CTA
 * pill class, the compact status line and the paused kill-switch bar. Split out
 * of BidPanel.tsx when the bar gained an awareness variant
 * (docs/specs/2026-06-13-mobile-awareness-only-design.md).
 */
import type { ReactNode } from "react"
import { DrawLine } from "../(ui)/DrawLine"
import { Icon } from "../(ui)/Icon"
import { SALE_ECONOMICS } from "../../lib/sale/economics"
import { fmtCompactUsd, fmtCount, fmtPrice } from "../../lib/sale/format"
import type { CommitmentData } from "../../lib/sale/types"
import { Countdown } from "./Countdown"

// Full-bleed fixed shell: spans the whole .screen width (inset only by the page
// frame's --reveal-padding, so its edges sit on the .screen edges), like the
// contrast tiles. The CARD background fills it; the .page-container inside re-contains
// the content on the shared grid.
export const SHELL =
  "bar-enter fixed bottom-[var(--reveal-padding)] left-[var(--reveal-padding)] right-[var(--reveal-padding)] z-[var(--z-sticky)]"
// All four corners on --frame-radius: full-bleed, the bottom corners meet the
// .screen's rounded bottom corners (same radius) so the frame stays seamless; the
// top corners round against the page above.
export const CARD = "overflow-hidden rounded-[var(--frame-radius)] bg-background"
export const CTA_PILL =
  "btn-pan group inline-flex cursor-pointer items-center justify-center rounded-full border border-faint bg-surface-contrast px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-on-contrast before:bg-on-contrast hover:text-surface-contrast"

export type BarMetric = { icon: string; value: ReactNode; label: string }

/** Shared bar shell: full-bleed SHELL + CARD, content re-contained on the 12-col
 * grid (cols 2-11), so the bar's text lines up with the page sections above. */
export function BarShell({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Bid panel" data-component="bid-panel" className={SHELL}>
      <div className={CARD}>
        <div className="page-container grid grid-cols-12 gap-6">
          <div className="band-10">{children}</div>
        </div>
      </div>
    </aside>
  )
}

/** Compact status line shared by the pre-sale and awareness bars (gate-row pattern). */
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
        {body ? <span className="text-muted"> {body}</span> : null}
      </p>
    </div>
  )
}

/** One read-only metric cell (value + label, optional leading icon) at the bar's
 * compact size. `compact` drops the icon so several cells fit on one mobile line.
 * Shared by the awareness bar (live + ended) and the desktop ended bar. */
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
      <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">{metric.label}</p>
    </div>
  )
}

/** Clock + countdown + caption, the bar's milestone block. `targetIso` / `caption`
 * are caller-computed (the next milestone differs by phase and journey). */
export function BarCountdown({ targetIso, caption }: { targetIso: string; caption: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon name="clock" draw={false} className="h-[18px] w-[18px]" />
      <div>
        <p className="font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
          <Countdown targetIso={targetIso} />
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">{caption}</p>
      </div>
    </div>
  )
}

/** The four live-auction metrics (clearing, time left, bidders, committed). One
 * source for both bars; "time left" is a live Countdown to the close. */
export function liveMetrics(commitment: CommitmentData): BarMetric[] {
  return [
    {
      icon: "clearing",
      value: commitment.clearingPriceUsd ? fmtPrice(commitment.clearingPriceUsd) : "TBD",
      label: "Clearing",
    },
    {
      icon: "clock",
      value: <Countdown targetIso={SALE_ECONOMICS.saleClosesIso} />,
      label: "Time left",
    },
    { icon: "users-group", value: fmtCount(commitment.uniqueCommitmentCount), label: "Bidders" },
    { icon: "database", value: fmtCompactUsd(commitment.totalCommittedUsd), label: "Committed" },
  ]
}

/** The three key live figures for the compact (mobile awareness) bar: clearing,
 * time left (no seconds, calmer), and total raised. Drops "Bidders" so the row
 * fits one line; uses "Raised" (as the ended bar does) for the committed total. */
export function liveKeyMetrics(commitment: CommitmentData): BarMetric[] {
  return [
    {
      icon: "clearing",
      value: commitment.clearingPriceUsd ? fmtPrice(commitment.clearingPriceUsd) : "TBD",
      label: "Clearing",
    },
    {
      icon: "clock",
      value: <Countdown targetIso={SALE_ECONOMICS.saleClosesIso} seconds={false} />,
      label: "Time left",
    },
    { icon: "database", value: fmtCompactUsd(commitment.totalCommittedUsd), label: "Raised" },
  ]
}

/** The three settled metrics shown once the auction has ended. */
export function finalMetrics(commitment: CommitmentData): BarMetric[] {
  return [
    { icon: "clearing", value: fmtPrice(commitment.clearingPriceUsd ?? 0), label: "Final price" },
    { icon: "database", value: fmtCompactUsd(commitment.totalCommittedUsd), label: "Raised" },
    { icon: "users-group", value: fmtCount(commitment.uniqueCommitmentCount), label: "Bidders" },
  ]
}

/**
 * Kill-switch bar (SALE_PAUSED, surfaced via the polled commitments feed): a
 * global override shown regardless of phase or device. The mutating routes
 * already 503. Placeholder copy, pending final wording.
 */
export function PausedBar() {
  return (
    <BarShell>
      <DrawLine immediate />
      <div className="flex flex-wrap items-center gap-3 pb-6 pt-4 sm:pb-8 sm:pt-6">
        <Icon name="clock" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
        <p className="text-sm">
          <span className="font-medium text-foreground">Bidding is paused.</span>{" "}
          <span className="text-muted">Please check back shortly.</span>
        </p>
      </div>
    </BarShell>
  )
}
