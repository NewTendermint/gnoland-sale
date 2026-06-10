import { FadeIn } from "../../(ui)/FadeIn"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
/**
 * Five-pillar pitch. Default section tone, 12-col grid, title block left +
 * lead paragraph, then 5 numbered features stacked or in a grid, with an
 * image placeholder on the right. Colors flow from semantic theme tokens.
 */
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { features } from "../../../content/sections/features"

export function Features() {
  return (
    <Section id="features">
      {/* Coordinated entrance: the title triggers, then the 5 feature points cascade
          and the image clips in 0.5s later (image + first point at index 2 x staggerMs
          250, the rest card by card). One trigger off the title (first visible member). */}
      <RevealGroup inline staggerMs={250}>
        <div className="col-span-12 lg:col-span-6">
          <div className="mb-16">
            <SectionHeading
              eyebrow="Why gno.land"
              title="Built for developers, designed for eternity"
              lead="Gno.land fundamentally changes the programming paradigm for blockchain."
              index={0}
            />
          </div>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2">
            {features.map((f, i) => (
              <RevealGroup as="li" key={f.title}>
                <FadeIn as="p" index={2 + i} className="section-label text-faint">
                  {String(i + 1).padStart(2, "0")}
                </FadeIn>
                <Reveal
                  as="h3"
                  index={2 + i}
                  className="mt-4 text-xl font-semibold tracking-tight text-foreground md:text-2xl"
                >
                  {f.title}
                </Reveal>
                <Reveal as="p" index={2 + i} className="mt-4 text-base text-muted">
                  {f.body}
                </Reveal>
              </RevealGroup>
            ))}
          </ul>
        </div>
        <div className="col-span-12 lg:col-span-6 lg:col-start-7 lg:pt-16">
          <ParallaxBox className="aspect-[2/3]" strength={200} index={2} />
        </div>
      </RevealGroup>
    </Section>
  )
}
