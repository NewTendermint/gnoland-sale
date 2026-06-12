import type { JourneyState } from "../../../lib/sale/types"

/**
 * Wallet-free funnel chrome: the Verify -> Connect -> Bid stepper and the in-button
 * winning/outbid status tag. Kept out of BidFlow (which pulls wagmi) so the bar's
 * top row and CTA can render them without dragging the wallet stack into the
 * initial bundle.
 */
const FUNNEL: { label: string; states: JourneyState[] }[] = [
  { label: "Verify", states: ["kyc-required", "kyc-pending", "kyc-failed", "not-eligible"] },
  { label: "Connect", states: ["disconnected", "wrong-network"] },
  { label: "Bid", states: ["ready", "has-bid-winning", "has-bid-outbid"] },
]

/** Funnel position: Verify -> Connect -> Bid, current step highlighted.
 * Rendered in the bar's top (metrics) row, right side, when expanded. */
export function FunnelSteps({ journey }: { journey: JourneyState }) {
  const current = FUNNEL.findIndex((s) => s.states.includes(journey))
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {FUNNEL.map((step, i) => {
        const phase = i < current ? "done" : i === current ? "current" : "upcoming"
        return (
          <li key={step.label} className="flex items-center gap-3">
            {i > 0 ? (
              <span className={`h-px w-6 ${i <= current ? "bg-border" : "bg-foreground"}`} />
            ) : null}
            <span className="flex items-center gap-2">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium tabular-nums ${
                  phase === "current"
                    ? "border-foreground bg-foreground text-background"
                    : phase === "done"
                      ? "border-border text-faint"
                      : "border-foreground text-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[10px] font-medium uppercase tracking-[0.2em] ${
                  phase === "done" ? "text-faint" : "text-foreground"
                }`}
              >
                {step.label}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Live status as a compact tag, rendered inside the bid CTA button (mint = winning,
 * amber = outbid). Filled with dark text so it stays legible on the CTA surface
 * whichever way the theme flips the button (black in light, white in dark). */
export function BidStatusTag({ journey }: { journey: JourneyState }) {
  if (journey === "has-bid-winning") {
    return (
      <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-mint">
        Winning
      </span>
    )
  }
  if (journey === "has-bid-outbid") {
    return (
      <span className="rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-on-amber">
        Outbid
      </span>
    )
  }
  return null
}
