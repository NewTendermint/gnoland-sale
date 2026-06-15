/**
 * Roadmap. Its own full-bleed contrast (black) tile (like PreFooterCta, rather than
 * Section tone="contrast") so the illustration band can bleed to the tile edges. The
 * band is flush to the TOP and SIDES of the tile (negative top margin cancels the
 * tile's top padding; no horizontal container, so it spans the full tile width; the
 * tile's overflow-hidden clips it to the rounded corners), with the section title
 * overlaid. Taller on mobile so the overlaid title never overflows the short band.
 * This image has NO external scroll parallax - only the internal scene parallax once
 * a WebGL scene drops in as its background. Below it, 8 milestones (4 past years + 4
 * future quarters) in a 4-col grid; Q1 2026 highlighted. Colors flow from
 * on-contrast tokens.
 */
import { ClipOpen } from "../../(ui)/ClipOpen"
import { FadeIn } from "../../(ui)/FadeIn"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { items } from "../../../content/sections/roadmap"

export function Roadmap() {
  return (
    <section id="roadmap" className="bg-background py-10 text-foreground lg:py-20">
      {/* The black tile clip-opens on scroll and the title reveals inside it as it
          grows - like HowItWorks. overflow-hidden clips the full-bleed band to the
          tile's rounded corners. */}
      <RevealGroup fromBottomPct={40}>
        <ClipOpen lead durationMs={2200} className="contrast-tile overflow-hidden py-12 lg:py-16">
          {/* Illustration band, full-bleed to the tile: flush to its top edge (the
              negative margin cancels the tile's top padding) and spanning the full
              tile width (no horizontal container). Taller on mobile (aspect-[2/1])
              so the overlaid title fits; the wide 3:1 ratio returns at sm+. A future
              WebGL scene becomes this band's background; bg-on-contrast/10 is the dark
              placeholder so the white title stays readable until the art lands. */}
          <div className="relative -mt-12 flex aspect-[3/2] items-center justify-center overflow-hidden rounded-b-[var(--frame-radius)] bg-on-contrast/10 px-6 text-center sm:aspect-[3/1] lg:-mt-16">
            <SectionHeading
              tone="contrast"
              eyebrow="Roadmap"
              title="From bootstrap to mainnet"
              index={0}
            />
          </div>

          {/* Milestones, re-contained on the shared 12-col grid like every section.
              They LEAVE the tile's clip-open timeline (RevealBoundary) for their OWN
              scroll trigger and reveal together when reached: every year, then every
              title, then every body across all 8 - not one-by-one. */}
          <div className="page-container">
            <div className="grid grid-cols-12 gap-6">
              <RevealBoundary>
                <RevealGroup
                  as="ol"
                  staggerMs={250}
                  className="col-span-12 mt-10 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:col-span-10 lg:col-start-2 lg:grid-cols-4 lg:mt-16"
                >
                  {items.map((item, i) => {
                    // 4-up grid on desktop: items 0-3 are the top row, 4-7 the bottom row.
                    // Delay the bottom row so the two rows cascade top-to-bottom rather
                    // than every date landing at once.
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
            </div>
          </div>
        </ClipOpen>
      </RevealGroup>
    </section>
  )
}
