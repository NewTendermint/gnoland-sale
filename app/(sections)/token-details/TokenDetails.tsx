"use client"

/**
 * Sale section, two visually distinct blocks:
 *   - YOUR POSITION block at the top: 4 user-specific metrics (commitment,
 *     filled, GNOT estimate, best bid) computed from the session's myBid +
 *     clearing price. Global market state lives in the sticky BidPanel to
 *     avoid duplication.
 *   - TERMS block below, separated by a strong hairline: 4 thematic groups
 *     (Token / Numbers / Bid range / Schedule) in a key/value grid.
 *
 * State variants for the position block (Layer 2 wires the switch):
 *   disconnected → CTA to connect wallet
 *   connected, no bids → values at 0/—, sub-line invites first bid
 *   connected, has bids → full values
 */
import { Fragment } from "react"
import { useSale } from "../../(layout)/SaleProvider"
import { Icon } from "../../(ui)/Icon"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import {
  positionMetricsActive,
  positionMetricsEmpty,
  termGroups,
} from "../../../content/sections/token-details"
import { bidStatus, gnotEstimate } from "../../../lib/sale/calc"
import { fmtGnot, fmtPrice, fmtUsd } from "../../../lib/sale/format"

type PositionState = "disconnected" | "no-bids" | "active"

export function TokenDetails() {
  // Derived from the sale context: disconnected until a wallet connects, active
  // once the session has a bid (myBid), else no-bids.
  const { journey, myBid, commitment } = useSale()
  const positionState: PositionState =
    journey === "disconnected" ? "disconnected" : myBid ? "active" : "no-bids"

  const positionMetrics: Array<{ icon: string; value: string; label: string }> = (() => {
    if (positionState !== "active" || !myBid) {
      return positionMetricsEmpty
    }
    // Live values in the content's order (commitment, filled, best bid, GNOT est).
    // Filled is binary on the clearing price: a bid at or above clearing clears in
    // full; true pro-rata at the margin is a settlement detail, unknown pre-close.
    // TODO(real-data): replace the binary filled with the real pro-rata fill once
    // settlement data is available.
    const filled =
      bidStatus(myBid.priceUsd, commitment.clearingPriceUsd) === "winning" ? "100%" : "0%"
    const values = [
      fmtUsd(myBid.committedUsd),
      filled,
      fmtPrice(myBid.priceUsd),
      fmtGnot(gnotEstimate(myBid.committedUsd, commitment.clearingPriceUsd)),
    ]
    return positionMetricsActive.map((m, i) => ({ ...m, value: values[i] }))
  })()

  return (
    <Section id="token-details">
      <div className="col-span-12 mb-12 flex flex-col items-center text-center lg:col-span-10 lg:col-start-2">
        <div className="mb-3 flex items-center gap-2">
          {positionState === "active" && (
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground opacity-30" />
              <span className="relative inline-flex size-2 rounded-full bg-foreground" />
            </span>
          )}
          <p className="font-mono text-xs uppercase tracking-widest text-foreground">
            Live auction
          </p>
        </div>
        <h2 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl">
          GNOT Token Sale
        </h2>
        <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">
          {positionState === "disconnected"
            ? "Connect a wallet to see your position in the auction."
            : positionState === "no-bids"
              ? "You have no bids yet. Place your first one using the panel below."
              : "Snapshot of your commitments at the current clearing price."}
        </p>
      </div>

      <div className="col-span-12 grid grid-cols-12 gap-6 border-y border-border py-12 lg:col-span-10 lg:col-start-2 lg:grid-cols-10">
        <div className="col-span-12 lg:col-span-3">
          <h3 className="font-mono text-2xl font-medium uppercase tracking-tight text-foreground lg:text-3xl">
            Your position
          </h3>
        </div>

        <dl className="col-span-12 flex flex-wrap items-end justify-end gap-8 sm:gap-10 lg:col-span-7">
          {positionMetrics.map((m, i) => (
            <Fragment key={m.label}>
              {i > 0 ? (
                <div aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />
              ) : null}
              <div>
                <div className="flex items-center gap-2">
                  <Icon name={m.icon} className="h-[18px] w-[18px]" />
                  <dd className="font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-3xl">
                    {m.value}
                  </dd>
                </div>
                <dt className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted">
                  {m.label}
                </dt>
              </div>
            </Fragment>
          ))}
        </dl>
      </div>

      <div className="col-span-12 flex flex-col lg:col-span-10 lg:col-start-2">
        {termGroups.map((g, gi) => (
          <div
            key={g.eyebrow}
            className="grid grid-cols-12 gap-6 border-b border-border py-5 lg:grid-cols-10 lg:py-6"
          >
            <div className="col-span-12 lg:col-span-3">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-faint tabular-nums">
                  {String(gi + 1).padStart(2, "0")}
                </span>
                <h3 className="font-mono text-2xl font-medium uppercase tracking-tight text-foreground lg:text-3xl">
                  {g.eyebrow}
                </h3>
              </div>
            </div>
            <dl className="col-span-12 lg:col-span-7">
              {g.rows.map((row, ri) => (
                <div
                  key={row.label}
                  className={`flex items-baseline justify-between gap-6 py-1 ${
                    ri > 0 ? "border-t border-foreground/5" : ""
                  }`}
                >
                  <dt className="font-mono text-xs uppercase tracking-widest text-muted">
                    {row.label}
                  </dt>
                  <dd
                    className={`text-right text-base font-medium ${
                      row.tbd ? "font-mono uppercase tracking-widest text-faint" : "text-foreground"
                    }`}
                  >
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}

        <div className="grid grid-cols-12 gap-6 border-b border-border py-5 lg:grid-cols-10 lg:py-6">
          <div className="col-span-12 lg:col-span-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-faint tabular-nums">
                {String(termGroups.length + 1).padStart(2, "0")}
              </span>
              <h3 className="font-mono text-2xl font-medium uppercase tracking-tight text-foreground lg:text-3xl">
                Disclosure
              </h3>
            </div>
          </div>
          <div className="col-span-12 text-right lg:col-span-7">
            <a
              href="#token-disclosure"
              className="group inline-flex items-baseline gap-2 text-base font-bold text-foreground underline-offset-4 hover:underline lg:text-lg"
            >
              Token Disclosure Document
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                ↗
              </span>
            </a>
            <p className="mt-2 ml-auto max-w-2xl text-sm text-muted">
              Full tokenomics, legal structure, and smart contract audit in one PDF.
            </p>
          </div>
        </div>
      </div>
    </Section>
  )
}
