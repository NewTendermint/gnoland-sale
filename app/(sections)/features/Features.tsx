/**
 * Five-pillar pitch. Default section tone, 12-col grid, title block left +
 * lead paragraph, then 5 numbered features stacked or in a grid, with an
 * image placeholder on the right. Colors flow from semantic theme tokens.
 */
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { features } from "../../../content/sections/features"

export function Features() {
  return (
    <Section id="features">
      <div className="col-span-12 lg:col-span-6">
        <div className="mb-16">
          <SectionHeading
            eyebrow="Why gno.land"
            title="Built for developers, designed for eternity"
            lead="Gno.land fundamentally changes the programming paradigm for blockchain."
          />
        </div>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2">
          {features.map((f, i) => (
            <li key={f.title}>
              <p className="section-label text-faint">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {f.title}
              </h3>
              <p className="mt-4 text-base text-muted">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-12 lg:col-span-6 lg:col-start-7 lg:pt-16">
        <div className="aspect-[2/3] w-full rounded-[var(--frame-radius)] bg-surface-alt" />
      </div>
    </Section>
  )
}
