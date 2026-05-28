/**
 * Ecosystem-in-numbers. Rendered on a contrast tile (Section owns the
 * inverted frame) to flip the rhythm of the page. Title block left, 7 stats
 * in a responsive grid right, separated by hairline dividers. Colors flow
 * from semantic on-contrast theme tokens.
 */
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { stats } from "../../../content/sections/stats"

export function Stats() {
  return (
    <Section id="stats" tone="contrast">
      <div className="col-span-12 lg:col-span-7 lg:col-start-2">
        <SectionHeading
          tone="contrast"
          eyebrow="By the numbers"
          title="The ecosystem in numbers"
          lead="Five years of compounding open source. Built in public, by a growing developer community."
        />
      </div>
      <dl className="col-span-12 mt-12 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:col-span-8 lg:col-start-4 lg:mt-16 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-t border-on-contrast/15 pt-6">
            <dd>
              <p className="font-mono text-2xl font-bold tabular-nums md:text-3xl lg:text-4xl">
                {s.value}
              </p>
            </dd>
            <dt className="section-label mt-3 text-on-contrast-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
    </Section>
  )
}
