import { Cta } from "../../(ui)/Cta"
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
      <RevealGroup inline staggerMs={150}>
        <div className="col-span-12 grid grid-cols-10 gap-x-6 gap-y-0 lg:col-span-10 lg:col-start-2">
          <div className="col-span-10 lg:col-span-7">
            <SectionHeading eyebrow="Ecosystem" title="Discover What's Being Built" index={0} />
          </div>

          <DrawLine className="col-span-10 mt-10 lg:mt-16" index={1} />

          <ul className="col-span-10 mt-6">
            {featured.map((p, i) => (
              <RevealBoundary key={p.name}>
                <RevealGroup as="li" className="flex flex-col gap-6 py-6">
                  {i > 0 ? <ItemDivider /> : null}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-10 md:gap-6">
                    <div className="flex flex-row-reverse items-start justify-between gap-3 md:col-span-3 md:flex-row md:self-start md:pr-4 md:pt-6">
                      <span className="shrink-0 text-faint">
                        <Icon name={p.icon} index={1} className="h-9 w-9 md:h-12 md:w-12" />
                      </span>
                      <div>
                        <Reveal
                          as="h3"
                          index={1}
                          className="text-left text-xl font-semibold leading-tight tracking-tight text-foreground md:text-right md:text-lg md:pt-0.5"
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
                    <div className="md:col-span-7 md:col-start-4 md:pt-6">
                      <Reveal as="p" index={2} className="text-2xl text-foreground">
                        {p.body}
                      </Reveal>
                      {p.href ? (
                        <FadeIn as="div" index={3} className="mt-5 flex justify-start">
                          <Cta
                            href={p.href}
                            external
                            arrow="diagonal"
                            label="Explore"
                            ariaLabel={`Explore ${p.name}`}
                            variant="ghost"
                            size="sm"
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

        <RevealBoundary>
          <DrawLine className="col-span-12 mt-12 lg:col-span-10 lg:col-start-2" />
        </RevealBoundary>

        <ul className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-10 pt-12 lg:col-span-10 lg:col-start-2 lg:grid-cols-4">
          {others.map((p) => (
            <RevealBoundary key={p.name}>
              <RevealGroup as="li">
                <span className="block text-faint">
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

        <RevealBoundary>
          <FadeIn as="div" className="col-span-12 mt-12 text-center lg:col-span-10 lg:col-start-2">
            <Cta
              href="https://github.com/gnoverse"
              external
              arrow="diagonal"
              label="Find other ecosystem projects"
              variant="ghost"
              size="sm"
            />
          </FadeIn>
        </RevealBoundary>
      </RevealGroup>
    </Section>
  )
}
