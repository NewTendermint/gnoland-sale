/**
 * Tokenomics. Visualization-focused section. Staggered 2-column layout
 * on desktop:
 *   - Left: Allocation tile (genesis breakdown, natural height, anchored
 *     top of grid)
 *   - Right: Section title (lg:pt-20 staircase offset) + Vesting tile
 *     below (mt-12 from title). Both natural height (lg:items-start)
 *     so Vesting sits visibly lower than Allocation's top and ends
 *     wherever its content ends. Same "en quinconce" rhythm used on
 *     Narrative and Partners sections.
 *
 * Mobile: title centered above tiles, then Allocation, then Vesting
 * (single column stack). Title is rendered twice in markup with
 * lg:hidden / hidden lg:block so the same text appears in the right
 * place per breakpoint; only one is visible at a time.
 *
 * Supply KPIs live in TokenDetails (Supply group). Value accrual /
 * utility mechanisms live in GnotUtility. This section is breakdown-
 * visualizations only.
 *
 * Numbers are the real, as-of-today figures from the team allocation +
 * vesting sheet (see content/sections/tokenomics.ts and sections.md #3),
 * not placeholders. The unlock schedule is identical for every allocation,
 * so it lives once in the Vesting tile rather than per allocation row.
 */
import { Fragment } from "react"
import { ClipOpen } from "../../(ui)/ClipOpen"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { Parallax } from "../../(ui)/Parallax"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import {
  TOTAL_SUPPLY,
  allocation,
  monthlyUnlocks,
  vesting,
} from "../../../content/sections/tokenomics"

const gnot = (n: number) => `${n.toLocaleString("en-US")} GNOT`

export function Tokenomics() {
  // Largest monthly unlock, used to scale the unlock-timeline bar heights.
  const peakUnlock = Math.max(...monthlyUnlocks)

  // Key facts for the Vesting tile, mirroring the allocation list rows.
  const vestingFacts: Array<{ label: string; value: string }> = [
    { label: "Cliff", value: vesting.cliff },
    { label: "At mainnet (M1)", value: `${vesting.tgeUnlockPct}%` },
    { label: "Each month (M2-M13)", value: `${vesting.monthlyUnlockPct}%` },
    {
      label: `Final month (M${vesting.distributionMonths})`,
      value: `${vesting.finalUnlockPct}%`,
    },
    { label: "Fully vested", value: `${vesting.fullyVestedMonths} months after mainnet` },
    { label: "Circulating at TGE", value: gnot(vesting.circulatingAtTge) },
  ]

  return (
    <Section id="tokenomics">
      {/* Coordinated entrance: the title reveals first (index 0), then BOTH tiles
          clip in together 0.5s later (clips at index 5 x staggerMs 100). One trigger
          off the first visible member - the mobile title is display:none on desktop,
          the coordinator skips it. */}
      <RevealGroup inline staggerMs={100}>
        {/*
        Mobile-only title (centered above the tiles). It is now a grid item,
        so the grid row-gap (gap-6, 24px) sits below it; mb-2 (8px) tops that
        up to the original 32px (mb-8) title-to-tile spacing. lg:hidden, so it
        leaves the layout entirely at desktop.
      */}
        <RevealGroup
          as="div"
          className="col-span-12 mb-2 flex flex-col items-center text-center lg:hidden"
        >
          <SectionHeading eyebrow="Tokenomics" title="How GNOT is distributed" index={0} />
          <Reveal as="p" className="mt-4 text-sm text-faint">
            Genesis allocation and unlock schedule. Total supply {gnot(TOTAL_SUPPLY)}.
          </Reveal>
        </RevealGroup>

        {/* Left col: Allocation tile (genesis breakdown). lg:self-start keeps the
          staircase rhythm (items align to top, natural height) that the section
          grid would otherwise stretch flat. */}
        <RevealGroup
          as="div"
          fromBottomPct={50}
          className="col-span-12 lg:col-span-5 lg:col-start-2 lg:self-start"
        >
          <Parallax strength={120}>
            <ClipOpen
              index={5}
              className="rounded-[var(--frame-radius)] bg-surface-contrast p-6 text-on-contrast sm:p-8 lg:p-10"
            >
              <FadeIn as="div" index={8} className="mb-4 flex items-baseline justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-widest text-on-contrast-muted">
                  Allocation
                </p>
                <p className="font-mono text-xs uppercase tracking-widest text-on-contrast-muted tabular-nums">
                  {gnot(TOTAL_SUPPLY)}
                </p>
              </FadeIn>

              <FadeIn
                as="div"
                index={9}
                role="img"
                aria-label="Genesis allocation breakdown across seven categories, summing to 100 percent of total supply"
                className="flex h-2 w-full overflow-hidden rounded-sm"
              >
                {allocation.map((row) => (
                  <div
                    key={row.category}
                    style={{ width: `${row.percent}%`, backgroundColor: row.color }}
                  />
                ))}
              </FadeIn>

              <ul className="mt-6">
                {allocation.map((row, i) => (
                  <Fragment key={row.category}>
                    <FadeIn as="li" index={10 + i} className="py-3">
                      {/* Top sub-row: dot + category + share of supply */}
                      <div className="flex items-baseline gap-3 text-sm">
                        <span
                          aria-hidden="true"
                          className="size-2.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-mono uppercase tracking-widest text-on-contrast">
                          {row.category}
                        </span>
                        <span className="ml-auto font-mono font-bold tabular-nums uppercase tracking-widest text-on-contrast">
                          {row.percent.toFixed(2)}%
                        </span>
                      </div>

                      {/* Bottom sub-row: absolute amount + purpose */}
                      <div className="mt-1 flex items-baseline gap-3 pl-[1.625rem]">
                        <span className="text-xs text-on-contrast-muted">{row.note}</span>
                        <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-on-contrast-muted">
                          {row.amount.toLocaleString("en-US")}
                        </span>
                      </div>
                    </FadeIn>
                    {i < allocation.length - 1 ? (
                      <DrawLine as="li" index={10 + i} colorClass="bg-on-contrast/15" />
                    ) : null}
                  </Fragment>
                ))}
              </ul>
            </ClipOpen>
          </Parallax>
        </RevealGroup>

        {/* Right col: desktop title (staircase offset) + Vesting tile */}
        <div className="col-span-12 lg:col-span-5 lg:col-start-7 lg:self-start lg:pt-20">
          {/* Desktop-only title (mirrors the mobile-only block above) */}
          <RevealGroup as="div" className="hidden lg:mb-12 lg:block">
            <SectionHeading eyebrow="Tokenomics" title="How GNOT is distributed" index={0} />
            <Reveal as="p" className="mt-4 text-sm text-faint">
              Genesis allocation and unlock schedule. Total supply {gnot(TOTAL_SUPPLY)}.
            </Reveal>
          </RevealGroup>

          {/* Vesting tile. Mirrors the allocation tile pattern. lg:mt-24 adds
            clearance below the title so the faster parallax float (±95px) does not
            ride up onto it. */}
          <RevealGroup fromBottomPct={50} className="lg:mt-24">
            <Parallax strength={190}>
              <ClipOpen
                index={5}
                className="rounded-[var(--frame-radius)] bg-surface-contrast p-6 text-on-contrast sm:p-8 lg:p-10"
              >
                <FadeIn
                  as="div"
                  index={8}
                  className="mb-2 flex items-baseline justify-between gap-3"
                >
                  <p className="font-mono text-xs uppercase tracking-widest text-on-contrast-muted">
                    Vesting
                  </p>
                  <p className="font-mono text-xs uppercase tracking-widest text-on-contrast-muted tabular-nums">
                    {vesting.distributionMonths} months
                  </p>
                </FadeIn>
                <FadeIn as="p" index={8} className="mb-6 text-xs text-on-contrast-muted">
                  Same schedule for every allocation. No cliff, then a linear monthly release.
                </FadeIn>

                {/* Monthly unlock timeline: one bar per release. The first 13 each
                    free 7%, the 14th frees 9% (the taller bar). aria-label carries
                    the schedule for non-visual users. */}
                <FadeIn
                  as="div"
                  index={9}
                  role="img"
                  aria-label={`Unlock timeline: ${vesting.tgeUnlockPct} percent at mainnet, ${vesting.monthlyUnlockPct} percent each month, ${vesting.finalUnlockPct} percent in the final month, fully vested ${vesting.fullyVestedMonths} months after mainnet`}
                  className="flex h-16 items-end gap-1"
                >
                  {monthlyUnlocks.map((pct, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: fixed positional schedule
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${(pct / peakUnlock) * 100}%`,
                        backgroundColor:
                          i === monthlyUnlocks.length - 1
                            ? "color-mix(in srgb, var(--on-contrast) 100%, transparent)"
                            : "color-mix(in srgb, var(--on-contrast) 55%, transparent)",
                      }}
                    />
                  ))}
                </FadeIn>
                <FadeIn as="div" index={9} className="pt-2">
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-on-contrast-muted">
                    <span>Mainnet (TGE)</span>
                    <span>Fully vested · M{vesting.distributionMonths}</span>
                  </div>
                </FadeIn>

                <ul className="mt-6">
                  {vestingFacts.map((fact, i) => (
                    <Fragment key={fact.label}>
                      <FadeIn
                        as="li"
                        index={10 + i}
                        className="flex items-baseline gap-3 py-3 text-sm"
                      >
                        <span className="font-mono uppercase tracking-widest text-on-contrast">
                          {fact.label}
                        </span>
                        <span className="ml-auto font-mono font-bold tabular-nums uppercase tracking-widest text-on-contrast-muted">
                          {fact.value}
                        </span>
                      </FadeIn>
                      {i < vestingFacts.length - 1 ? (
                        <DrawLine as="li" index={10 + i} colorClass="bg-on-contrast/15" />
                      ) : null}
                    </Fragment>
                  ))}
                </ul>
              </ClipOpen>
            </Parallax>
          </RevealGroup>
        </div>
      </RevealGroup>
    </Section>
  )
}
