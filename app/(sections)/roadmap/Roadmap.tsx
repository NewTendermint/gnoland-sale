import { FadeIn } from "../../(ui)/FadeIn"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
/**
 * Roadmap. Centered title block, full-width illustration band below,
 * then 8 milestones (4 past years + 4 future quarters) in a 4-col grid.
 * Q1 2026 highlighted as the milestone the sale buys into.
 */
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { items } from "../../../content/sections/roadmap"

export function Roadmap() {
  return (
    <Section id="roadmap">
      {/* Coordinated entrance: the title triggers, then the image + the milestones
          reveal 0.5s later, LINE BY LINE across all milestones (every year together,
          then every title, then every body). One trigger off the title. */}
      <RevealGroup inline staggerMs={250}>
        <div className="col-span-12 mb-12 flex flex-col items-center text-center lg:col-span-10 lg:col-start-2 lg:mb-16">
          <SectionHeading eyebrow="Roadmap" title="From bootstrap to mainnet" index={0} />
        </div>

        <div className="col-span-12">
          <ParallaxBox
            className="aspect-[3/1]"
            strength={70}
            index={2}
            aria-label="Roadmap illustration placeholder, to be replaced"
          />
        </div>

        <ol className="col-span-12 mt-16 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:col-span-10 lg:col-start-2 lg:grid-cols-4">
          {items.map((item) => (
            <RevealGroup as="li" key={item.year}>
              <FadeIn
                as="p"
                index={2}
                className={`mb-3 font-mono text-xs uppercase tracking-widest ${
                  item.highlight ? "font-bold text-foreground" : "text-muted"
                }`}
              >
                {item.year}
              </FadeIn>
              {item.title ? (
                <Reveal
                  as="h3"
                  index={3}
                  className="mb-2 text-base font-semibold tracking-tight text-foreground md:text-lg"
                >
                  {item.title}
                </Reveal>
              ) : null}
              <Reveal as="p" index={4} className="text-sm text-muted">
                {item.body}
              </Reveal>
            </RevealGroup>
          ))}
        </ol>
      </RevealGroup>
    </Section>
  )
}
