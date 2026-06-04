/**
 * Ecosystem. Two-tier showcase: 6 flagship projects shown as full cards
 * with icon + name + category + body description, then the 7 remaining
 * projects shown as compact half-size cards (icon + name + category
 * only) in a denser 6-col grid. Total = 13 projects visible at once.
 */
import { CtaArrow } from "../../(ui)/CtaArrow"
import { Icon } from "../../(ui)/Icon"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { featured, others } from "../../../content/sections/ecosystem"

export function Ecosystem() {
  return (
    <Section id="ecosystem">
      <div className="col-span-12 mb-16 flex flex-col items-center text-center lg:col-span-6 lg:col-start-4">
        <SectionHeading eyebrow="Ecosystem" title="Built by a growing community" />
      </div>

      <ul className="col-span-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:col-span-10 lg:col-start-2 lg:grid-cols-3">
        {featured.map((p) => {
          const inner = (
            <>
              <span className="block text-faint transition-colors group-hover:text-foreground">
                <Icon name={p.icon} className="h-8 w-8" />
              </span>
              <div className="mt-6 flex items-baseline gap-3">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{p.name}</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                  {p.category}
                </span>
              </div>
              <p className="mt-3 text-base text-muted">{p.body}</p>
            </>
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

      <ul className="col-span-12 mt-8 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-12 sm:grid-cols-3 md:grid-cols-6 lg:col-span-10 lg:col-start-2">
        {others.map((p) => (
          <li key={p.name} className="group">
            <span className="block text-faint transition-colors group-hover:text-foreground">
              <Icon name={p.icon} className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-sm font-semibold tracking-tight text-foreground">{p.name}</h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
              {p.category}
            </p>
            {p.body ? <p className="mt-3 text-xs leading-snug text-muted">{p.body}</p> : null}
          </li>
        ))}
      </ul>

      <div className="col-span-12 mt-12 text-center lg:col-span-10 lg:col-start-2">
        <a
          href="https://github.com/gnoverse"
          target="_blank"
          rel="noreferrer noopener"
          className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:text-muted"
        >
          <span>Find other ecosystem projects</span>
          <CtaArrow />
        </a>
      </div>
    </Section>
  )
}
