/**
 * Partners. Two staggered placeholder images (left big, right with the title +
 * a lower image). The partner list is its own thing here - unlike the other
 * sections' lists: it sits UNDER the big left tile in a narrow column (section
 * cols 2-4, via a 6-col sub-grid inside the left column), each entry stacked
 * (name above its short body). Clean content, no tile backgrounds.
 */
import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { partners } from "../../../content/sections/partners"

export function Partners() {
  // Single source for the heading copy: a mobile-only copy leads the section, the
  // desktop copy stays in the right column (only one is visible per breakpoint).
  const heading = { eyebrow: "Partners", title: "Working alongside" }
  return (
    <Section id="partners">
      <RevealGroup inline staggerMs={250}>
        {/* Mobile: the title leads the section; desktop keeps it in the right column
            below. order-first + lg:hidden swap which copy shows. */}
        <div className="order-first col-span-12 lg:hidden">
          <SectionHeading eyebrow={heading.eyebrow} title={heading.title} index={0} />
        </div>
        {/* Left column: the big tile, then the partner list below it. The 6-col
            sub-grid lets the list sit at section cols 2-4 (sub-cols 2-4). */}
        <div className="col-span-12 grid grid-cols-1 gap-y-12 lg:col-span-6 lg:col-start-1 lg:grid-cols-6 lg:gap-y-32">
          <div className="lg:col-span-6">
            <RevealBoundary>
              <ParallaxBox className="aspect-[3/2] lg:aspect-[4/5]" strength={90} />
            </RevealBoundary>
          </div>

          <ul className="lg:col-span-5 lg:col-start-2">
            {partners.map((p, i) => (
              // Each partner leaves the title group (RevealBoundary) for its own scroll
              // trigger, so they reveal one at a time. Name rises, then the body rises.
              <RevealBoundary key={p.name}>
                <RevealGroup as="li" className={i > 0 ? "mt-8" : ""}>
                  <Reveal
                    as="h3"
                    index={0}
                    className="text-lg font-semibold leading-tight tracking-tight text-foreground"
                  >
                    {p.name}
                  </Reveal>
                  <Reveal as="p" index={1} className="mt-3 text-xl leading-snug text-foreground">
                    {p.body}
                  </Reveal>
                </RevealGroup>
              </RevealBoundary>
            ))}
          </ul>
        </div>

        {/* Right column: the title (desktop only - hidden on mobile, where the copy
            above leads) + the second image on its own trigger. */}
        <div className="col-span-12 lg:col-span-4 lg:col-start-8 lg:pt-32">
          <div className="hidden lg:block">
            <SectionHeading eyebrow={heading.eyebrow} title={heading.title} index={0} />
          </div>
          <RevealBoundary>
            <ParallaxBox className="mt-4 aspect-[3/2] lg:mt-48 lg:aspect-[4/5]" strength={320} />
          </RevealBoundary>
        </div>
      </RevealGroup>
    </Section>
  )
}
