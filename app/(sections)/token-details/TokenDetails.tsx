"use client"

/**
 * Sale section, two blocks:
 *   - Your position: user-specific metrics (commitment, filled, GNOT estimate, best
 *     bid) computed from the session's myBid + clearing price. Global market state
 *     lives in the sticky BidPanel to avoid duplication.
 *   - Terms: thematic key/value groups separated by a hairline.
 *
 * Position block has three states: not-ready (not yet verified + connected + eligible,
 * prompt to connect), ready with no bids (empty values, prompt to bid), and bids placed
 * (full values).
 */
import { Fragment } from "react"
import { Countdown } from "../../(layout)/Countdown"
import { useSale } from "../../(layout)/SaleProvider"
import { ArrowLink } from "../../(ui)/ArrowLink"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { Icon } from "../../(ui)/Icon"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Rise } from "../../(ui)/Rise"
import { Section } from "../../(ui)/Section"
import { HEADING_TITLE } from "../../(ui)/SectionHeading"
import {
  type PositionMetric,
  documents,
  positionMetricsActive,
  positionMetricsEmpty,
  termGroups,
} from "../../../content/sections/token-details"
import { bidStatus, gnotEstimate } from "../../../lib/sale/calc"
import { SALE_ECONOMICS } from "../../../lib/sale/economics"
import { fmtGnot, fmtPrice, fmtUsd } from "../../../lib/sale/format"
import { derivePositionState } from "../../../lib/sale/journey"

/** Scroll-trigger line for the terms-table groups (and the documents): each reveals
 * when its top reaches this % from the BOTTOM of the viewport. Lower = the trigger
 * sits lower on screen, so a group animates only once you are nearly on it. */
const TABLE_REVEAL_PCT = 10

export function TokenDetails() {
  const { phase, preSaleStage, journey, myBid, commitment } = useSale()
  // "Your position" display state, derived (+ unit-tested) in lib/sale/journey.ts.
  const positionState = derivePositionState(journey, myBid !== null)
  // Pre-sale: no position exists yet, so the header carries the big next-milestone
  // countdown and the position block stays out entirely.
  const preSale = phase === "pre-sale"
  const registrationOpen = preSaleStage === "registration-open"

  const positionMetrics: PositionMetric[] = (() => {
    if (positionState !== "active" || !myBid) {
      return positionMetricsEmpty
    }
    // Live values in the content's order (USDC committed, bid price, GNOT allocation,
    // status). Status is binary on the clearing price: a bid at or above clearing reads
    // Active, otherwise Outbid; the true pro-rata fill at the margin is a settlement
    // detail, unknown pre-close.
    // TODO(real-data): refine Active/Outbid with the real settlement outcome once
    // settlement data is available.
    const status =
      bidStatus(myBid.priceUsd, commitment.clearingPriceUsd) === "winning" ? "Active" : "Outbid"
    const values = [
      fmtUsd(myBid.committedUsd),
      fmtPrice(myBid.priceUsd),
      fmtGnot(gnotEstimate(myBid.committedUsd, commitment.clearingPriceUsd)),
      status,
    ]
    return positionMetricsActive.map((m, i) => ({ ...m, value: values[i] }))
  })()

  return (
    <Section id="token-details">
      {/* Title cascade: the title triggers, then the line and the position block
          cascade just after - one trigger instead of each row scroll-appearing on its
          own. `inline` adds no box, the grid is intact. The terms table + documents
          break out below into their own trigger (see the RevealBoundary further down)
          so they animate when the reader reaches THEM, not when the title does. */}
      <RevealGroup inline>
        <RevealGroup
          as="div"
          className="col-span-12 mb-12 flex flex-col items-center text-center lg:col-span-10 lg:col-start-2"
        >
          <FadeIn as="div" className="mb-3 flex items-center gap-2">
            {/* The pulsing live dot only makes sense while the auction runs. */}
            {phase === "live" && positionState === "active" && (
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-foreground opacity-30" />
                <span className="relative inline-flex size-2 rounded-full bg-foreground" />
              </span>
            )}
            <p className="font-mono text-xs uppercase tracking-widest text-foreground">
              {preSale ? "Public sale" : phase === "ended" ? "Auction closed" : "Live auction"}
            </p>
          </FadeIn>
          <Reveal as="h2" type="words" className={`${HEADING_TITLE} text-foreground`}>
            GNOT Token Sale
          </Reveal>
          {preSale ? (
            <FadeIn as="div" className="mt-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                {registrationOpen ? "Sale opens in" : "Registration opens in"}
              </p>
              <p className="mt-1 font-mono text-4xl font-medium tracking-tight tabular-nums text-foreground sm:text-5xl">
                <Countdown
                  targetIso={
                    registrationOpen
                      ? SALE_ECONOMICS.saleOpensIso
                      : SALE_ECONOMICS.registrationOpensIso
                  }
                />
              </p>
            </FadeIn>
          ) : (
            // "Your position" needs a wallet, so it is funnel-only: on awareness
            // contexts (touch / < lg) there is no position to show, so the subtext
            // and the block below are hidden there (they only render on desktop).
            <FadeIn
              as="p"
              className="mt-4 hidden max-w-2xl text-base text-muted funnel:block md:text-lg"
            >
              {positionState === "not-ready"
                ? "Connect your wallet to see your position in the auction."
                : positionState === "no-bids"
                  ? "You have no bids yet. Place your first one using the panel below."
                  : "Snapshot of your commitments at the current clearing price."}
            </FadeIn>
          )}
        </RevealGroup>

        {!preSale ? (
          <>
            <DrawLine className="col-span-12 hidden funnel:block lg:col-span-10 lg:col-start-2" />

            <FadeIn
              as="div"
              className="col-span-12 hidden grid-cols-12 gap-6 py-12 funnel:grid lg:col-span-10 lg:col-start-2 lg:grid-cols-10"
            >
              <div className="col-span-12 lg:col-span-3">
                <h3 className="font-mono text-2xl font-medium uppercase tracking-tight text-foreground lg:text-3xl">
                  Your position
                </h3>
              </div>

              <dl className="col-span-12 flex flex-wrap items-end justify-end gap-x-4 gap-y-6 sm:gap-x-6 lg:col-span-7">
                {positionMetrics.map((m, i) => (
                  <Fragment key={m.label}>
                    {i > 0 ? (
                      <div aria-hidden="true" className="hidden h-8 w-px bg-border sm:block" />
                    ) : null}
                    <div>
                      <div className="flex items-center gap-2">
                        {m.badge ? (
                          // Status reads as a word, not a figure: a monochrome dot
                          // (filled = Active, ring = Outbid, faint = no bid) takes the
                          // metric-icon slot and the value drops tabular-nums.
                          <span
                            aria-hidden="true"
                            className={`size-2.5 shrink-0 rounded-full ${
                              m.value === "Active"
                                ? "bg-foreground"
                                : m.value === "Outbid"
                                  ? "border border-foreground/40"
                                  : "bg-border"
                            }`}
                          />
                        ) : (
                          <Icon name={m.icon} className="h-[18px] w-[18px]" />
                        )}
                        <dd
                          className={`font-mono text-2xl font-medium tracking-tight sm:text-3xl ${
                            m.badge ? "" : "tabular-nums"
                          }`}
                        >
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
            </FadeIn>
          </>
        ) : null}

        <DrawLine className="band-10" />

        {/* The terms table + documents leave the title cascade. RevealBoundary cuts
            the outer group context, then EACH term group (and the documents) gets its
            OWN inline RevealGroup = its own scroll trigger (TABLE_REVEAL_PCT), so every
            group animates when YOU reach it, not all at once when the title does. */}
        <RevealBoundary>
          <div className="col-span-12 flex flex-col lg:col-span-10 lg:col-start-2">
            {termGroups.map((g, gi) => (
              <RevealGroup inline fromBottomPct={TABLE_REVEAL_PCT} key={g.eyebrow}>
                {/* Plain layout grid (no group-level FadeIn): inside, the title
                    reveals line-by-line like the tiles, the number fades, and each
                    row rises from a mask - all members of this group's cascade, so
                    they stagger in (number/title slot 0, rows 1..n, divider last)
                    when the group is reached. */}
                <div className="grid grid-cols-12 gap-6 py-5 lg:grid-cols-10 lg:py-6">
                  <div className="col-span-12 lg:col-span-3">
                    <div className="flex items-baseline gap-3">
                      <FadeIn
                        as="span"
                        index={0}
                        className="font-mono text-xs text-faint tabular-nums"
                      >
                        {String(gi + 1).padStart(2, "0")}
                      </FadeIn>
                      <Reveal
                        as="h3"
                        index={0}
                        className="font-mono text-2xl font-medium uppercase tracking-tight text-foreground lg:text-3xl"
                      >
                        {g.eyebrow}
                      </Reveal>
                    </div>
                  </div>
                  <dl className="col-span-12 lg:col-span-7">
                    {g.rows.map((row, ri) => (
                      <Rise
                        key={row.label}
                        index={ri + 1}
                        className={`flex items-baseline justify-between gap-6 py-1 ${
                          ri > 0 ? "border-t border-foreground/5" : ""
                        }`}
                      >
                        <dt className="font-mono text-xs uppercase tracking-widest text-muted">
                          {row.label}
                        </dt>
                        <dd
                          className={`text-right font-medium ${
                            row.tbd
                              ? "font-mono text-xs uppercase tracking-widest text-faint"
                              : "text-base text-foreground"
                          }`}
                        >
                          {row.href ? (
                            <a
                              href={row.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-baseline gap-1 underline-offset-4 hover:underline"
                            >
                              {row.value}
                              <span aria-hidden="true">↗</span>
                            </a>
                          ) : (
                            row.value
                          )}
                        </dd>
                      </Rise>
                    ))}
                  </dl>
                </div>
                <DrawLine index={g.rows.length + 1} />
              </RevealGroup>
            ))}
          </div>

          {/* Own trigger: the documents reveal when reached, not with the last group. */}
          <RevealGroup inline fromBottomPct={TABLE_REVEAL_PCT}>
            <div className="col-span-12 mt-6 flex flex-wrap items-center justify-end gap-3 lg:col-span-10 lg:col-start-2">
              {documents.map((d, di) => (
                <FadeIn as="div" index={di} key={d.label}>
                  <ArrowLink
                    href={d.href}
                    external={!d.href.startsWith("#")}
                    arrow="diagonal"
                    label={d.value}
                    variant="ghost"
                  />
                </FadeIn>
              ))}
            </div>
          </RevealGroup>
        </RevealBoundary>
      </RevealGroup>
    </Section>
  )
}
