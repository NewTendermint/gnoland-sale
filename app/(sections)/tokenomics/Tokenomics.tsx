// Tokenomics: Allocation + Vesting breakdown tiles (no visible heading, sr-only h2).
import { ClipOpen } from "../../(ui)/ClipOpen"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import {
  TOTAL_SUPPLY,
  allocation,
  circulating,
  circulatingBreakdown,
} from "../../../content/sections/tokenomics"

const gnot = (n: number) => `${n.toLocaleString("en-US")} GNOT`

export function Tokenomics() {
  const circulatingPct = ((circulating.total / TOTAL_SUPPLY) * 100).toFixed(1)
  const lockedPct = (100 - Number(circulatingPct)).toFixed(1)

  const circFacts: Array<{ label: string; value: string; light?: boolean }> = [
    { label: "Lockup", value: circulating.lockup, light: true },
    { label: "FDV (at $0.0645)", value: `$${circulating.fdvUsd.toLocaleString("en-US")}` },
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

            <ul className="mt-6 flex flex-1 flex-col justify-between">
              {allocation.map((row, i) => (
                <FadeIn as="li" key={row.category} index={9 + i} className="py-2">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-mono uppercase tracking-widest text-foreground">
                      {row.category}
                    </span>
                    <span className="font-mono font-bold tabular-nums uppercase tracking-widest text-foreground">
                      {row.percent.toFixed(2)}%
                    </span>
                  </div>
                  <div
                    role="img"
                    aria-label={`${row.category}: ${row.percent} percent of total supply`}
                    className="mt-2 h-2 w-full overflow-hidden rounded-sm bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                  >
                    <div
                      className="h-full rounded-sm bg-foreground"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-3">
                    <span className="text-xs text-muted">{row.note}</span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                      {row.amount.toLocaleString("en-US")}
                    </span>
                  </div>
                </FadeIn>
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
                Circulating Supply
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-muted tabular-nums">
                ~{circulatingPct}% at TGE
              </p>
            </FadeIn>

            <FadeIn
              as="div"
              index={9}
              role="img"
              aria-label={`Of the ${TOTAL_SUPPLY.toLocaleString("en-US")} GNOT total supply, about ${circulatingPct} percent is circulating at mainnet launch and ${lockedPct} percent is still locked`}
              className="flex h-4 w-full overflow-hidden rounded-sm"
            >
              <div
                style={{
                  width: `${(circulating.tokenSaleSupply / TOTAL_SUPPLY) * 100}%`,
                  backgroundColor: "var(--foreground)",
                }}
              />
              <div
                style={{
                  width: `${((circulating.total - circulating.tokenSaleSupply) / TOTAL_SUPPLY) * 100}%`,
                  backgroundColor: "color-mix(in srgb, var(--foreground) 40%, transparent)",
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  width: `${lockedPct}%`,
                  backgroundColor: "color-mix(in srgb, var(--foreground) 8%, transparent)",
                }}
              />
            </FadeIn>

            <FadeIn
              as="div"
              index={9}
              className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted"
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-[1px]"
                  style={{ backgroundColor: "var(--foreground)" }}
                />
                Token Sale
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-[1px]"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--foreground) 40%, transparent)",
                  }}
                />
                Other circulating
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-[1px]"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--foreground) 14%, transparent)",
                  }}
                />
                Locked {lockedPct}%
              </span>
            </FadeIn>

            <div className="mt-7 flex flex-1 flex-col">
              <FadeIn
                as="div"
                index={10}
                className="flex items-baseline justify-between gap-3 pb-2.5 text-sm"
              >
                <span className="font-mono font-bold uppercase tracking-widest text-foreground">
                  Total circulating at TGE
                </span>
                <span className="font-mono font-bold tabular-nums uppercase tracking-widest text-foreground">
                  {circulating.total.toLocaleString("en-US")}
                </span>
              </FadeIn>

              <DrawLine colorClass="bg-border" index={10} />

              <ul className="mt-2 flex flex-1 flex-col justify-between">
                {circulatingBreakdown.map((row, i) => (
                  <FadeIn as="li" key={row.category} index={11 + i} className="py-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-mono uppercase tracking-widest text-foreground">
                        {row.category}
                      </span>
                      <span className="font-mono font-bold tabular-nums uppercase tracking-widest text-foreground">
                        {row.amount.toLocaleString("en-US")}
                      </span>
                    </div>
                    {row.children ? (
                      <ul className="mt-2 ml-px flex flex-col gap-y-1.5 border-l border-border pl-4">
                        {row.children.map((c) => (
                          <li
                            key={c.category}
                            className="flex items-baseline justify-between gap-3 text-xs"
                          >
                            <span
                              className={`font-mono uppercase tracking-[0.15em] ${c.highlight ? "font-bold text-foreground" : "text-muted"}`}
                            >
                              {c.category}
                            </span>
                            <span
                              className={`font-mono tabular-nums uppercase tracking-[0.15em] ${c.highlight ? "font-bold text-foreground" : "text-muted"}`}
                            >
                              {c.amount.toLocaleString("en-US")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </FadeIn>
                ))}
              </ul>
            </div>

            <DrawLine className="mt-5" colorClass="bg-border" index={24} />

            <ul className="mt-3 flex flex-col gap-y-2.5">
              {circFacts.map((fact, i) => (
                <FadeIn
                  as="li"
                  key={fact.label}
                  index={25 + i}
                  className="flex items-baseline justify-between gap-4 text-sm"
                >
                  <span className="shrink-0 font-mono uppercase tracking-widest text-muted">
                    {fact.label}
                  </span>
                  <span
                    className={`text-right font-mono uppercase tracking-widest ${fact.light ? "font-normal text-muted" : "font-bold text-foreground"}`}
                  >
                    {fact.value}
                  </span>
                </FadeIn>
              ))}
            </ul>
          </ClipOpen>
        </RevealGroup>
      </RevealGroup>
    </Section>
  )
}
