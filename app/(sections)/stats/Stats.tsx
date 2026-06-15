/**
 * Ecosystem-in-numbers. Rendered on a contrast tile (Section owns the
 * inverted frame) to flip the rhythm of the page. Title block left, 7 stats
 * in a responsive grid right, separated by hairline dividers. Colors flow
 * from semantic on-contrast theme tokens.
 */
import { CountUp } from "../../(ui)/CountUp"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { stats } from "../../../content/sections/stats"

export function Stats() {
  return (
    <Section id="stats" tone="contrast" clip>
      <div className="band-10">
        <SectionHeading
          tone="contrast"
          eyebrow="By the numbers"
          title="The ecosystem in numbers"
          lead="Five years of compounding open source. Built in public, by a growing developer community."
        />
      </div>
      <RevealGroup
        as="dl"
        staggerMs={0}
        className="col-span-12 mt-12 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:col-span-7 lg:col-start-5 lg:mt-16 lg:grid-cols-4"
      >
        {stats.map((s) => (
          // All figures share one slot (index 0) so they launch together, once,
          // inside the tile timeline (the panel leads, the row fires at its base).
          <div key={s.label}>
            <DrawLine colorClass="bg-on-contrast/15" index={0} />
            <dd className="pt-6">
              <CountUp
                as="p"
                value={s.value}
                index={0}
                className="font-mono text-2xl font-bold tabular-nums md:text-3xl lg:text-4xl"
              />
            </dd>
            <FadeIn as="dt" index={0} className="section-label mt-3 text-on-contrast-muted">
              {s.label}
            </FadeIn>
          </div>
        ))}
      </RevealGroup>
    </Section>
  )
}
