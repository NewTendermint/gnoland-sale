/**
 * Ecosystem. Editorial "statement" disposition for the flagship projects
 * (matching Features / GNOT utility): a full-width 12-col image banner on top,
 * a left-aligned title in a 10-col band, a full-width animated rule, then the
 * featured projects as table rows (icon above the name + category on the left,
 * body offset to the right with a hairline above each paragraph). Below the
 * band, the remaining projects stay a dense compact grid, then a CTA.
 */
import { ArrowLink } from "../../(ui)/ArrowLink"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { Icon } from "../../(ui)/Icon"
import { ItemDivider } from "../../(ui)/ItemDivider"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { featured, others } from "../../../content/sections/ecosystem"

export function Ecosystem() {
  return (
    <Section id="ecosystem">
      {/* Title + rule reveal together (title group). Everything below LEAVES that
          group via RevealBoundary so it reveals on its own scroll trigger, one at a
          time as you reach it: each featured row, the mid rule, each compact card, the
          CTA. Per item: divider draws (slot 0), icon draws + name rises (1), category
          fades + body rises (2), the Explore CTA fades (3). */}
      <RevealGroup inline staggerMs={150}>
        {/* 10-col band: title left, animated rule, featured projects as rows. */}
        <div className="col-span-12 grid grid-cols-10 gap-x-6 gap-y-0 lg:col-span-10 lg:col-start-2">
          <div className="col-span-10 lg:col-span-7">
            <SectionHeading eyebrow="Ecosystem" title="Built by a growing community" index={0} />
          </div>

          <DrawLine className="col-span-10 mt-10 lg:mt-16" index={1} />

          <ul className="col-span-10 mt-6">
            {featured.map((p, i) => (
              <RevealBoundary key={p.name}>
                <RevealGroup as="li" className="group flex flex-col gap-6 py-6">
                  {i > 0 ? <ItemDivider /> : null}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-10 md:gap-6">
                    {/* Title cell: the name + category form ONE group beside the icon,
                        so their gap is the group's own (tight mt-1) and never depends on
                        the icon's height. items-start top-aligns the icon with that group
                        (≈ the body's first line). On mobile the group leads on the left
                        (name a touch larger) with the icon to its right; from md the
                        desktop order returns (icon in the gutter, group right-aligned). */}
                    <div className="flex flex-row-reverse items-start justify-between gap-3 md:col-span-3 md:flex-row md:self-start md:pr-4 md:pt-4">
                      <span className="shrink-0 text-faint transition-colors group-hover:text-foreground">
                        <Icon name={p.icon} index={1} className="h-10 w-10 md:h-12 md:w-12" />
                      </span>
                      <div>
                        <Reveal
                          as="h3"
                          index={1}
                          className="text-left text-xl font-semibold leading-tight tracking-tight text-foreground md:text-right md:text-lg"
                        >
                          {p.name}
                        </Reveal>
                        <FadeIn
                          as="p"
                          index={2}
                          className="mt-1 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-faint md:text-right"
                        >
                          {p.category}
                        </FadeIn>
                      </div>
                    </div>
                    {/* Body cell offset to cols 4-10: paragraph, then a ghost CTA. */}
                    <div className="md:col-span-7 md:col-start-4 md:pt-6">
                      <Reveal as="p" index={2} className="text-2xl text-foreground">
                        {p.body}
                      </Reveal>
                      {/* Only link when the project has a real URL: "Explore X" landing on
                          the generic org page is a label/destination mismatch. */}
                      {p.href ? (
                        <FadeIn as="div" index={3} className="mt-5 flex justify-start">
                          <ArrowLink
                            href={p.href}
                            external
                            arrow="diagonal"
                            label="Explore"
                            ariaLabel={`Explore ${p.name}`}
                            variant="ghost"
                          />
                        </FadeIn>
                      ) : null}
                    </div>
                  </div>
                </RevealGroup>
              </RevealBoundary>
            ))}
          </ul>
        </div>

        {/* Mid rule between the featured rows and the compact grid - own trigger. */}
        <RevealBoundary>
          <DrawLine className="col-span-12 mt-12 lg:col-span-10 lg:col-start-2" />
        </RevealBoundary>

        <ul className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-10 pt-12 lg:col-span-10 lg:col-start-2 lg:grid-cols-4">
          {others.map((p) => (
            <RevealBoundary key={p.name}>
              <RevealGroup as="li" className="group">
                <span className="block text-faint transition-colors group-hover:text-foreground">
                  <Icon name={p.icon} index={0} className="h-8 w-8" />
                </span>
                <Reveal
                  as="h3"
                  index={0}
                  className="mt-4 text-lg font-semibold leading-tight tracking-tight text-foreground"
                >
                  {p.name}
                </Reveal>
                <FadeIn
                  as="p"
                  index={1}
                  className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-faint"
                >
                  {p.category}
                </FadeIn>
                {p.body ? (
                  <Reveal as="p" index={1} className="mt-3 text-sm leading-snug text-muted">
                    {p.body}
                  </Reveal>
                ) : null}
              </RevealGroup>
            </RevealBoundary>
          ))}
        </ul>

        {/* Closing CTA - own trigger, fades in when reached. */}
        <RevealBoundary>
          <FadeIn as="div" className="col-span-12 mt-12 text-center lg:col-span-10 lg:col-start-2">
            <ArrowLink
              href="https://github.com/gnoverse"
              external
              label="Find other ecosystem projects"
              variant="ghost"
            />
          </FadeIn>
        </RevealBoundary>
      </RevealGroup>
    </Section>
  )
}
