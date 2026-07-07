import { CountUp } from "../../(ui)/CountUp"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { stats } from "../../../content/sections/stats"
import { fetchTest13Transactions } from "../../../lib/stats/test13"

export async function Stats() {
  // Live Test13 count (server-side ISR, 2h); every other stat stays static.
  const test13 = await fetchTest13Transactions()
  const items = stats.map((s) => (s.label === "Test13 transactions" ? { ...s, value: test13 } : s))
  return (
    <Section id="stats" tone="contrast" clip>
      <div className="band-10">
        <SectionHeading
          tone="contrast"
          eyebrow="Gno.land in Numbers"
          title="The Ecosystem in Numbers"
          lead="Five years of compounding open-source development. Built transparently in public by a growing developer community."
        />
      </div>
      <RevealGroup
        as="dl"
        staggerMs={0}
        className="col-span-12 mt-12 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:col-span-7 lg:col-start-5 lg:mt-16 lg:grid-cols-4"
      >
        {items.map((s) => (
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
