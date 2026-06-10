import { FadeIn } from "../../(ui)/FadeIn"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
/**
 * Partners. Mirrors the Narrative "About" pattern: 2 placeholder images
 * staggered diagonally (left big, right with title + image lower), then
 * 4 partner cards below as square-proportioned blocks, offset from the
 * left edge. Clean content, no tile backgrounds.
 */
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { partners } from "../../../content/sections/partners"

export function Partners() {
  return (
    <Section id="partners">
      <RevealGroup inline staggerMs={250}>
        <div className="col-span-12 lg:col-span-6 lg:col-start-1">
          <ParallaxBox className="aspect-[4/5]" strength={90} index={2} />
        </div>

        <div className="col-span-12 lg:col-span-4 lg:col-start-8 lg:pt-32">
          <SectionHeading eyebrow="Partners" title="Working alongside" />
          <ParallaxBox className="mt-48 aspect-[4/5]" strength={320} index={2} />
        </div>
      </RevealGroup>

      <ul className="col-span-12 mt-20 grid grid-cols-2 gap-6 lg:col-span-8 lg:col-start-3 lg:grid-cols-4">
        {partners.map((p, i) => (
          <RevealGroup
            as="li"
            key={p.name}
            className={`aspect-square ${i === 2 ? "lg:col-start-1" : ""}`}
          >
            <div className="flex items-center gap-3">
              <FadeIn
                as="div"
                aria-label={`${p.name} logo placeholder`}
                className="size-8 shrink-0 rounded-md bg-surface-alt"
              />
              <Reveal
                as="h3"
                className="text-base font-semibold tracking-tight text-foreground md:text-lg"
              >
                {p.name}
              </Reveal>
            </div>
            <Reveal as="p" className="mt-3 text-xs leading-snug text-muted lg:text-sm">
              {p.body}
            </Reveal>
          </RevealGroup>
        ))}
      </ul>
    </Section>
  )
}
