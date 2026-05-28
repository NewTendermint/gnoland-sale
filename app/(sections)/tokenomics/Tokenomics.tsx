/**
 * Tokenomics. Visualization-focused section. Staggered 2-column layout
 * on desktop:
 *   - Left: Allocation tile (natural height, anchored top of grid)
 *   - Right: Section title (lg:pt-20 staircase offset) + Treasury tile
 *     below (mt-12 from title). Both natural height (lg:items-start)
 *     so Treasury sits visibly lower than Allocation's top and ends
 *     wherever its content ends. Same "en quinconce" rhythm used on
 *     Narrative and Partners sections.
 *
 * Mobile: title centered above tiles, then Allocation, then Treasury
 * (single column stack). Title is rendered twice in markup with
 * lg:hidden / hidden lg:block so the same text appears in the right
 * place per breakpoint; only one is visible at a time.
 *
 * Supply KPIs live in TokenDetails (Supply group). Value accrual /
 * utility mechanisms live in GnotUtility. This section is breakdown-
 * visualizations only.
 *
 * All numeric data are placeholders pending team disclosure
 * (B6, B7, B11 in docs/REQUIREMENTS_FROM_TEAMS.md).
 */
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { allocation, treasury } from "../../../content/sections/tokenomics"

export function Tokenomics() {
  // Hatched fill used per-row in the Allocation tile to signal placeholder
  // vesting state without claiming specific cliff/linear ratios. on-contrast
  // ink so it flips with the tile.
  const hatchedBg =
    "repeating-linear-gradient(45deg, color-mix(in srgb, var(--on-contrast) 22%, transparent) 0, color-mix(in srgb, var(--on-contrast) 22%, transparent) 4px, color-mix(in srgb, var(--on-contrast) 6%, transparent) 4px, color-mix(in srgb, var(--on-contrast) 6%, transparent) 8px)"

  return (
    <Section id="tokenomics">
      {/*
        Mobile-only title (centered above the tiles). It is now a grid item,
        so the grid row-gap (gap-6, 24px) sits below it; mb-2 (8px) tops that
        up to the original 32px (mb-8) title-to-tile spacing. lg:hidden, so it
        leaves the layout entirely at desktop.
      */}
      <div className="col-span-12 mb-2 flex flex-col items-center text-center lg:hidden">
        <SectionHeading eyebrow="Tokenomics" title="How GNOT is distributed" />
        <p className="mt-4 text-sm text-faint">
          Illustrative example. Final figures pending team disclosure.
        </p>
      </div>

      {/* Left col: Allocation tile (carries vesting per-row). lg:self-start
          keeps the staircase rhythm (items align to top, natural height)
          that the section grid would otherwise stretch flat. */}
      <div className="col-span-12 lg:col-span-5 lg:col-start-2 lg:self-start">
        <div className="rounded-[var(--frame-radius)] bg-surface-contrast p-6 text-on-contrast sm:p-8 lg:p-10">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-on-contrast-muted">
              Allocation
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-on-contrast-muted tabular-nums">
              Total · 100%
            </p>
          </div>

          <div
            className="flex h-2 w-full overflow-hidden rounded-sm"
            role="img"
            aria-label="Allocation breakdown placeholder, six equal segments pending team disclosure"
          >
            {allocation.map((row) => (
              <div
                key={row.category}
                style={{ width: `${row.percent}%`, backgroundColor: row.color }}
              />
            ))}
          </div>

          <ul className="mt-6">
            {allocation.map((row) => (
              <li
                key={row.category}
                className="border-b border-on-contrast/15 py-3 last:border-b-0"
              >
                {/* Top sub-row: proportional info (dot + category + % TBD) */}
                <div className="flex items-baseline gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="font-mono uppercase tracking-widest text-on-contrast">
                    {row.category}
                  </span>
                  <span className="ml-auto font-mono font-bold tabular-nums uppercase tracking-widest text-on-contrast-muted">
                    TBD
                  </span>
                </div>

                {/* Bottom sub-row: temporal info (hatched timeline + cliff/linear text) */}
                <div
                  aria-hidden="true"
                  className="mt-3 h-2 w-full overflow-hidden rounded-sm"
                  style={{ backgroundImage: hatchedBg }}
                />
                <p className="mt-1 text-right font-mono text-[10px] uppercase tracking-widest text-on-contrast-muted">
                  Cliff TBD · Linear TBD
                </p>
              </li>
            ))}
          </ul>

          {/*
            Time axis at the tile bottom. Anchors the per-row hatched
            bars as temporal. Endpoints kept generic (TGE / Final unlock
            TBD) to avoid fabricating specific durations.
          */}
          <div className="mt-6 border-t border-on-contrast/15 pt-3">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-on-contrast-muted">
              <span>TGE</span>
              <span>Final unlock TBD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right col: desktop title (staircase offset) + Treasury tile */}
      <div className="col-span-12 lg:col-span-5 lg:col-start-7 lg:self-start lg:pt-20">
        {/* Desktop-only title (mirrors the mobile-only block above) */}
        <div className="hidden lg:mb-12 lg:block">
          <SectionHeading eyebrow="Tokenomics" title="How GNOT is distributed" />
          <p className="mt-4 text-sm text-faint">
            Illustrative example. Final figures pending team disclosure.
          </p>
        </div>

        {/* Treasury use tile. Mirrors the allocation top-half pattern. */}
        <div className="rounded-[var(--frame-radius)] bg-surface-contrast p-6 text-on-contrast sm:p-8 lg:p-10">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="font-mono text-xs uppercase tracking-widest text-on-contrast-muted">
              Treasury use
            </p>
            <p className="font-mono text-xs uppercase tracking-widest text-on-contrast-muted tabular-nums">
              Total · 100%
            </p>
          </div>
          <p className="mb-6 text-xs text-on-contrast-muted">How raised funds are deployed.</p>

          <div
            className="flex h-2 w-full overflow-hidden rounded-sm"
            role="img"
            aria-label="Treasury use breakdown placeholder, four equal segments pending team disclosure"
          >
            {treasury.map((row) => (
              <div
                key={row.category}
                style={{ width: `${row.percent}%`, backgroundColor: row.color }}
              />
            ))}
          </div>

          <ul className="mt-6">
            {treasury.map((row) => (
              <li
                key={row.category}
                className="flex items-baseline gap-3 border-b border-on-contrast/15 py-3 text-sm last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: row.color }}
                />
                <span className="font-mono uppercase tracking-widest text-on-contrast">
                  {row.category}
                </span>
                <span className="ml-auto font-mono font-bold tabular-nums uppercase tracking-widest text-on-contrast-muted">
                  {row.note}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
