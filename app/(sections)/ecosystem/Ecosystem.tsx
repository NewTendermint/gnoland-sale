/**
 * Ecosystem. Two-tier showcase: flagship projects as full cards (icon + name +
 * category + body), then the rest as compact half-size cards (icon + name + category)
 * in a denser 6-col grid.
 */
import { CtaArrow } from "../../(ui)/CtaArrow"
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
      {/* Coordinated entrance: the title triggers, then the cards reveal LINE BY LINE
          across all cards at once (every icon together, then every name, then every
          body) - not card by card. The index is the line's position inside a card,
          shared by every card. One trigger off the title (first visible member). */}
      <RevealGroup inline staggerMs={250}>
        <div className="col-span-12 mb-16 flex flex-col items-center text-center lg:col-span-6 lg:col-start-4">
          <SectionHeading eyebrow="Ecosystem" title="Built by a growing community" index={0} />
        </div>

        <ul className="col-span-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:col-span-10 lg:col-start-2 lg:grid-cols-3">
          {featured.map((p) => {
            const inner = (
              <RevealGroup>
                <span className="block text-faint transition-colors group-hover:text-foreground">
                  <Icon name={p.icon} index={2} className="h-8 w-8" />
                </span>
                <div className="mt-6 flex items-baseline gap-3">
                  <Reveal
                    as="h3"
                    index={3}
                    className="text-lg font-semibold tracking-tight text-foreground"
                  >
                    {p.name}
                  </Reveal>
                  <FadeIn
                    as="span"
                    index={3}
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint"
                  >
                    {p.category}
                  </FadeIn>
                </div>
                <Reveal as="p" index={4} className="mt-3 text-base text-muted">
                  {p.body}
                </Reveal>
              </RevealGroup>
            )
            return (
              <li key={p.name} className="group">
                {p.href ? (
                  <a href={p.href} target="_blank" rel="noreferrer noopener" className="block">
                    {inner}
                  </a>
                ) : (
                  <div>{inner}</div>
                )}
              </li>
            )
          })}
        </ul>

        <DrawLine index={2} className="col-span-12 mt-8 lg:col-span-10 lg:col-start-2" />

        <ul className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-8 pt-12 sm:grid-cols-3 md:grid-cols-6 lg:col-span-10 lg:col-start-2">
          {others.map((p) => (
            <RevealGroup as="li" key={p.name} className="group">
              <span className="block text-faint transition-colors group-hover:text-foreground">
                <Icon name={p.icon} index={2} className="h-5 w-5" />
              </span>
              <Reveal
                as="h3"
                index={3}
                className="mt-3 text-sm font-semibold tracking-tight text-foreground"
              >
                {p.name}
              </Reveal>
              <FadeIn
                as="p"
                index={4}
                className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-faint"
              >
                {p.category}
              </FadeIn>
              {p.body ? (
                <Reveal as="p" index={5} className="mt-3 text-xs leading-snug text-muted">
                  {p.body}
                </Reveal>
              ) : null}
            </RevealGroup>
          ))}
        </ul>

        <FadeIn
          as="div"
          index={6}
          className="col-span-12 mt-12 text-center lg:col-span-10 lg:col-start-2"
        >
          <a
            href="https://github.com/gnoverse"
            target="_blank"
            rel="noreferrer noopener"
            className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:text-muted"
          >
            <span>Find other ecosystem projects</span>
            <CtaArrow />
          </a>
        </FadeIn>
      </RevealGroup>
    </Section>
  )
}
