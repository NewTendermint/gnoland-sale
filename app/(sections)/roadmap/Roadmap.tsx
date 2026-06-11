/**
 * Roadmap. Rendered on a contrast (black) tile. A full-bleed illustration band
 * is flush to the TOP of the tile (negative margins cancel the tile's top
 * padding) with the section title overlaid on it. This image has NO external
 * scroll parallax - only the internal scene parallax once a WebGL scene drops in
 * as its background. Below it, 8 milestones (4 past years + 4 future quarters)
 * in a 4-col grid; Q1 2026 highlighted. Colors flow from on-contrast tokens.
 */
import { FadeIn } from "../../(ui)/FadeIn"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { items } from "../../../content/sections/roadmap"

export function Roadmap() {
  return (
    <Section id="roadmap" tone="contrast" clip>
      {/* Coordinated entrance: the title triggers, then the milestones reveal 0.5s
          later, LINE BY LINE across all milestones (every year together, then every
          title, then every body). One trigger off the title. */}
      <RevealGroup inline staggerMs={250}>
        {/* Illustration band flush to the top of the tile (the negative margins
            cancel the tile's top padding), with the title overlaid. No external
            parallax; a future WebGL scene becomes this band's background and
            carries its own internal parallax. bg-on-contrast/10 is the dark
            placeholder so the white title stays readable until the art lands. */}
        <div className="relative col-span-12 -mt-12 flex aspect-[3/1] items-center justify-center overflow-hidden rounded-[var(--frame-radius)] bg-on-contrast/10 px-6 text-center lg:-mt-16">
          <SectionHeading
            tone="contrast"
            eyebrow="Roadmap"
            title="From bootstrap to mainnet"
            index={0}
          />
        </div>

        <ol className="col-span-12 mt-16 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:col-span-10 lg:col-start-2 lg:grid-cols-4">
          {items.map((item) => (
            <RevealGroup as="li" key={item.year}>
              <FadeIn
                as="p"
                index={2}
                className={`mb-0.5 font-mono text-base leading-tight tracking-tight text-on-contrast md:text-lg ${
                  item.highlight ? "font-bold" : "font-semibold"
                }`}
              >
                {item.year}
              </FadeIn>
              {item.title ? (
                <Reveal
                  as="h3"
                  index={3}
                  className="mb-3 text-base font-semibold leading-tight tracking-tight text-on-contrast-muted md:text-lg"
                >
                  {item.title}
                </Reveal>
              ) : null}
              <Reveal as="p" index={4} className="text-sm text-on-contrast-muted">
                {item.body}
              </Reveal>
            </RevealGroup>
          ))}
        </ol>
      </RevealGroup>
    </Section>
  )
}
