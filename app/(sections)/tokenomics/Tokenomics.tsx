// Tokenomics: Allocation + Vesting breakdown tiles (no visible heading, sr-only h2).
import { Fragment } from "react"
import { ClipOpen } from "../../(ui)/ClipOpen"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import {
  TOTAL_SUPPLY,
  allocation,
  monthlyUnlocks,
  vesting,
} from "../../../content/sections/tokenomics"

const gnot = (n: number) => `${n.toLocaleString("en-US")} GNOT`

export function Tokenomics() {
  const peakUnlock = Math.max(...monthlyUnlocks)

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
    <Section id="tokenomics" gridClassName="-mt-6 lg:-mt-14">
      <RevealGroup inline staggerMs={70} fromBottomPct={0}>
        <h2 className="sr-only">How GNOT is distributed</h2>

        <RevealGroup
          as="div"
          fromBottomPct={50}
          className="col-span-12 flex flex-col lg:col-span-5 lg:col-start-2"
        >
          <ClipOpen
            index={1}
            className="flex flex-1 flex-col rounded-[var(--frame-radius)] bg-surface-alt p-6 text-foreground sm:p-8 lg:p-10"
          >
            <FadeIn as="div" index={8} className="mb-4 flex items-baseline justify-between gap-3">
              <p className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
                Token Distribution
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted tabular-nums">
                {gnot(TOTAL_SUPPLY)}
              </p>
            </FadeIn>

            <FadeIn
              as="div"
              index={9}
              role="img"
              aria-label="Genesis allocation breakdown across seven categories, summing to 100 percent of total supply"
              className="flex h-4 w-full overflow-hidden rounded-sm"
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
                    <div className="flex items-baseline gap-3 text-sm">
                      <span
                        aria-hidden="true"
                        className="size-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="font-mono uppercase tracking-widest text-foreground">
                        {row.category}
                      </span>
                      <span className="ml-auto font-mono font-bold tabular-nums uppercase tracking-widest text-foreground">
                        {row.percent.toFixed(2)}%
                      </span>
                    </div>

                    <div className="mt-1 flex items-baseline gap-3 pl-[1.625rem]">
                      <span className="text-xs text-muted">{row.note}</span>
                      <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-muted">
                        {row.amount.toLocaleString("en-US")}
                      </span>
                    </div>
                  </FadeIn>
                  {i < allocation.length - 1 ? (
                    <DrawLine as="li" index={10 + i} colorClass="bg-border" />
                  ) : null}
                </Fragment>
              ))}
            </ul>
          </ClipOpen>
        </RevealGroup>

        <RevealGroup
          as="div"
          fromBottomPct={50}
          className="col-span-12 flex flex-col lg:col-span-5 lg:col-start-7"
        >
          <ClipOpen
            index={1}
            className="flex flex-1 flex-col rounded-[var(--frame-radius)] bg-surface-alt p-6 text-foreground sm:p-8 lg:p-10"
          >
            <FadeIn as="div" index={8} className="mb-4 flex items-baseline justify-between gap-3">
              <p className="font-mono text-sm font-bold uppercase tracking-widest text-foreground">
                Vesting
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted tabular-nums">
                {vesting.distributionMonths} months
              </p>
            </FadeIn>

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
                        ? "color-mix(in srgb, var(--foreground) 100%, transparent)"
                        : "color-mix(in srgb, var(--foreground) 55%, transparent)",
                  }}
                />
              ))}
            </FadeIn>
            <FadeIn as="div" index={9} className="pt-2">
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                <span>Mainnet (TGE)</span>
                <span>Fully vested · M{vesting.distributionMonths}</span>
              </div>
            </FadeIn>

            <ul className="mt-6">
              {vestingFacts.map((fact, i) => (
                <Fragment key={fact.label}>
                  <FadeIn as="li" index={10 + i} className="flex items-baseline gap-3 py-3 text-sm">
                    <span className="font-mono uppercase tracking-widest text-foreground">
                      {fact.label}
                    </span>
                    <span className="ml-auto font-mono font-bold tabular-nums uppercase tracking-widest text-foreground">
                      {fact.value}
                    </span>
                  </FadeIn>
                  {i < vestingFacts.length - 1 ? (
                    <DrawLine as="li" index={10 + i} colorClass="bg-border" />
                  ) : null}
                </Fragment>
              ))}
            </ul>

            <FadeIn as="p" index={8} className="mt-auto pt-6 text-xs text-muted">
              Same schedule for every allocation. No cliff, then a linear monthly release.
            </FadeIn>
          </ClipOpen>
        </RevealGroup>
      </RevealGroup>
    </Section>
  )
}
