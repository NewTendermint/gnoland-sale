/**
 * Core team. 8 named individuals (5 verified against the official
 * gno.land blog post + 3 added pending team confirmation on spelling
 * and bios).
 *
 * Layout: asymmetric. Title block on the left column (cols 2-5,
 * left-aligned, sticky on desktop while the list scrolls past),
 * credits list on the right column (cols 7-11). Each entry: name in
 * editorial typography + short bio in mono caps, separated by hairline
 * borders. The asymmetric split clearly separates "section header"
 * from "list items" so the h2 isn't read as just another name.
 *
 * Mobile: title centered above the list (single column stack).
 *
 * Avatar/photo intentionally omitted, pure typography credits style.
 */
import { Fragment } from "react"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { team } from "../../../content/sections/team"

export function Team() {
  return (
    <Section id="team">
      <RevealGroup
        as="div"
        className="col-span-12 mb-12 flex flex-col items-center text-center lg:col-span-6 lg:col-start-4 lg:mb-16"
      >
        <SectionHeading eyebrow="Core team" title="The team behind gno.land" />
        <Reveal as="p" className="mt-4 max-w-xl text-base text-muted md:text-lg">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore.
        </Reveal>
      </RevealGroup>

      <DrawLine className="col-span-12 lg:col-span-10 lg:col-start-2" />
      <ul className="col-span-12 lg:col-span-10 lg:col-start-2">
        {team.map((p) => (
          <Fragment key={p.name}>
            <FadeIn as="li" className="py-6 text-center lg:py-8">
              <h3 className="text-3xl font-bold uppercase leading-[1.05] tracking-tight text-foreground md:text-4xl lg:text-5xl">
                {p.name}
              </h3>
              <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted lg:text-sm">
                {p.bio}
              </p>
            </FadeIn>
            <DrawLine as="li" />
          </Fragment>
        ))}
      </ul>
    </Section>
  )
}
