import { stats } from "@/content/sections/stats"
import { fetchTest13Transactions } from "@/lib/stats/test13"
import { getTranslations } from "next-intl/server"
import { CountUp } from "../../(ui)/CountUp"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"

export async function Stats() {
  const t = await getTranslations("Stats")
  // Live Test13 count (server-side ISR, 2h); every other stat stays static.
  const test13 = await fetchTest13Transactions()
  const items = stats.map((s) => (s.id === "test13" ? { ...s, value: test13 } : s))
  return (
    <Section id="stats" tone="contrast" clip>
      <div className="band-10">
        <SectionHeading
          tone="contrast"
          eyebrow={t("eyebrow")}
          title={t("title")}
          lead={t("lead")}
        />
      </div>
      <RevealGroup
        as="dl"
        staggerMs={0}
        className="col-span-12 mt-12 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:col-span-7 lg:col-start-5 lg:mt-16 lg:grid-cols-4"
      >
        {/* flex-col-reverse: a dt must precede its dd in the DOM (screen readers pair them by
            source order) while the value stays visually above the label. The dd carries the
            decorative line itself - dl group divs admit only dt/dd children. */}
        {items.map((s) => (
          <div key={s.id} className="flex flex-col-reverse">
            <FadeIn as="dt" index={0} className="section-label mt-3 text-on-contrast-muted">
              {t(`${s.id}.label`)}
            </FadeIn>
            <dd>
              <DrawLine colorClass="bg-on-contrast/15" index={0} />
              <CountUp
                as="p"
                value={s.value}
                index={0}
                className="pt-6 font-mono text-2xl font-bold tabular-nums md:text-3xl lg:text-4xl"
              />
            </dd>
          </div>
        ))}
      </RevealGroup>
    </Section>
  )
}
