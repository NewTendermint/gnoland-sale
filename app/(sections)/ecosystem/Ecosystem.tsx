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
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { featured, others } from "../../../content/sections/ecosystem"

export function Ecosystem() {
  return (
    <Section id="ecosystem">
      {/* Coordinated entrance: title 1, rule 2, then the featured rows cascade
          (3 + i), the compact grid and CTA after, at staggerMs 150. */}
      <RevealGroup inline staggerMs={150}>
        {/* 10-col band: title left, animated rule, featured projects as rows. */}
        <div className="col-span-12 grid grid-cols-10 gap-x-6 gap-y-0 lg:col-span-10 lg:col-start-2">
          <div className="col-span-10 lg:col-span-7">
            <SectionHeading eyebrow="Ecosystem" title="Built by a growing community" index={1} />
          </div>

          <DrawLine className="col-span-10 mt-16" index={2} />

          <ul className="col-span-10 mt-6">
            {featured.map((p, i) => (
              <RevealGroup
                as="li"
                key={p.name}
                className={`group grid grid-cols-1 gap-2 py-6 md:grid-cols-10 md:gap-6 ${
                  i > 0 ? " border-t border-foreground/10 md:border-t-0" : ""
                }`}
              >
                {/* Title cell: icon + name, with the category as a borderless
                    subtitle under the name (reads as a label, not a pill). */}
                <div className="md:col-span-3 md:self-start md:pr-4 md:pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-faint transition-colors group-hover:text-foreground">
                      <Icon name={p.icon} index={3 + i} className="h-12 w-12" />
                    </span>
                    <Reveal
                      as="h3"
                      index={3 + i}
                      className="text-right text-lg font-semibold leading-tight tracking-tight text-foreground"
                    >
                      {p.name}
                    </Reveal>
                  </div>
                  <FadeIn
                    as="p"
                    index={3 + i}
                    className="mt-1 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-faint"
                  >
                    {p.category}
                  </FadeIn>
                </div>
                {/* Body cell offset to cols 4-10: paragraph, then a ghost CTA that
                    links to the project (or the gnoverse org when it has no site). */}
                <div
                  className={`md:col-span-7 md:col-start-4 md:pt-6 ${
                    i > 0 ? "md:border-t md:border-foreground/10" : ""
                  }`}
                >
                  <Reveal as="p" index={3 + i} className="text-2xl text-foreground">
                    {p.body}
                  </Reveal>
                  <FadeIn as="div" index={3 + i} className="mt-5 flex justify-start">
                    <ArrowLink
                      href={p.href ?? "https://github.com/gnoverse"}
                      external
                      arrow="diagonal"
                      label="Explore"
                      ariaLabel={`Explore ${p.name}`}
                      variant="ghost"
                    />
                  </FadeIn>
                </div>
              </RevealGroup>
            ))}
          </ul>
        </div>

        <DrawLine index={5} className="col-span-12 mt-12 lg:col-span-10 lg:col-start-2" />

        <ul className="col-span-12 grid grid-cols-1 gap-x-6 gap-y-10 pt-12 sm:grid-cols-2 lg:col-span-10 lg:col-start-2 lg:grid-cols-4">
          {others.map((p) => (
            <RevealGroup as="li" key={p.name} className="group">
              <span className="block text-faint transition-colors group-hover:text-foreground">
                <Icon name={p.icon} index={6} className="h-8 w-8" />
              </span>
              <Reveal
                as="h3"
                index={7}
                className="mt-4 text-lg font-semibold leading-tight tracking-tight text-foreground"
              >
                {p.name}
              </Reveal>
              <FadeIn
                as="p"
                index={8}
                className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-faint"
              >
                {p.category}
              </FadeIn>
              {p.body ? (
                <Reveal as="p" index={9} className="mt-3 text-sm leading-snug text-muted">
                  {p.body}
                </Reveal>
              ) : null}
            </RevealGroup>
          ))}
        </ul>

        <FadeIn
          as="div"
          index={10}
          className="col-span-12 mt-12 text-center lg:col-span-10 lg:col-start-2"
        >
          <ArrowLink
            href="https://github.com/gnoverse"
            external
            label="Find other ecosystem projects"
            variant="ghost"
          />
        </FadeIn>
      </RevealGroup>
    </Section>
  )
}
