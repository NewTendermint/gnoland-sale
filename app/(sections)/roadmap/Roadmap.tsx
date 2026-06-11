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
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { items } from "../../../content/sections/roadmap"

export function Roadmap() {
  return (
    <Section id="roadmap" tone="contrast" clip>
      {/* The black tile clip-opens on scroll (Section clip) and the title reveals
          inside it as it grows - like HowItWorks. The 8 milestones below LEAVE that
          timeline (RevealBoundary) for their OWN scroll trigger and reveal together
          when reached: every year, then every title, then every body across all 8 -
          not one-by-one. */}
      {/* Illustration band flush to the top of the tile (the negative margins cancel
          the tile's top padding), with the title overlaid. No external parallax; a
          future WebGL scene becomes this band's background and carries its own internal
          parallax. bg-on-contrast/10 is the dark placeholder so the white title stays
          readable until the art lands. */}
      <div className="relative col-span-12 -mt-12 flex aspect-[3/1] items-center justify-center overflow-hidden rounded-[var(--frame-radius)] bg-on-contrast/10 px-6 text-center lg:-mt-16">
        <SectionHeading
          tone="contrast"
          eyebrow="Roadmap"
          title="From bootstrap to mainnet"
          index={0}
        />
      </div>

      <RevealBoundary>
        <RevealGroup
          as="ol"
          staggerMs={250}
          className="col-span-12 mt-16 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:col-span-10 lg:col-start-2 lg:grid-cols-4"
        >
          {items.map((item, i) => {
            // 4-up grid on desktop: items 0-3 are the top row, 4-7 the bottom row.
            // Delay the bottom row so the two rows cascade top-to-bottom rather than
            // every date landing at once.
            const rowDelayMs = i < 4 ? 0 : 240
            return (
              <RevealGroup as="li" key={item.year}>
                <FadeIn
                  as="p"
                  index={0}
                  delayMs={rowDelayMs}
                  className={`mb-0.5 font-mono text-base leading-tight tracking-tight text-on-contrast md:text-lg ${
                    item.highlight ? "font-bold" : "font-semibold"
                  }`}
                >
                  {item.year}
                </FadeIn>
                {item.title ? (
                  <Reveal
                    as="h3"
                    index={1}
                    delayMs={rowDelayMs}
                    className="mb-3 text-base font-semibold leading-tight tracking-tight text-on-contrast-muted md:text-lg"
                  >
                    {item.title}
                  </Reveal>
                ) : null}
                <Reveal
                  as="p"
                  index={2}
                  delayMs={rowDelayMs}
                  className="text-sm text-on-contrast-muted"
                >
                  {item.body}
                </Reveal>
              </RevealGroup>
            )
          })}
        </RevealGroup>
      </RevealBoundary>
    </Section>
  )
}
