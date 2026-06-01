import type { JourneyState } from "../../../lib/sale/types"

/**
 * Wallet-free funnel chrome: the Connect -> Verify -> Bid stepper and the
 * winning/outbid status chip. Kept out of BidFlow (which pulls wagmi) so the bar's
 * top row can render these without dragging the wallet stack into the initial bundle.
 */
const FUNNEL: { label: string; states: JourneyState[] }[] = [
  { label: "Connect", states: ["disconnected", "wrong-network"] },
  { label: "Verify", states: ["kyc-required", "kyc-pending", "kyc-failed", "not-eligible"] },
  { label: "Bid", states: ["ready", "has-bid-winning", "has-bid-outbid"] },
]

/** Funnel position: Connect -> Verify -> Bid, current step highlighted.
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
              <span className={`h-px w-6 ${i <= current ? "bg-foreground" : "bg-border"}`} />
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
                {step.label}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Bid status chip for the top metrics row. Winning = bid clears (in allocation);
 * Outbid = below the clearing price. The off-page outbid alert (email / Base app
 * push) is the deferred re-engagement channel (REQUIREMENTS A.13.2). */
export function BidStatus({ journey }: { journey: JourneyState }) {
  if (journey === "has-bid-winning") {
    return (
      <span className="rounded-full bg-mint-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-mint">
        Winning
      </span>
    )
  }
  if (journey === "has-bid-outbid") {
    return (
      <span className="rounded-full border border-amber px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber">
        Outbid
      </span>
    )
  }
  return null
}
