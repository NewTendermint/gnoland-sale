/**
 * Roadmap. Centered title block, full-width illustration band below,
 * then 8 milestones (4 past years + 4 future quarters) in a 4-col grid.
 * Q1 2026 highlighted as the milestone the sale buys into.
 */
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { items } from "../../../content/sections/roadmap"

export function Roadmap() {
  return (
    <Section id="roadmap">
      <div className="col-span-12 mb-12 flex flex-col items-center text-center lg:col-span-10 lg:col-start-2 lg:mb-16">
        <SectionHeading eyebrow="Roadmap" title="From bootstrap to mainnet" />
      </div>

      <div className="col-span-12">
        <div
          aria-label="Roadmap illustration placeholder, to be replaced"
          className="aspect-[3/1] w-full rounded-[var(--frame-radius)] bg-surface-alt"
        />
      </div>

      <ol className="col-span-12 mt-16 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:col-span-10 lg:col-start-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.year}>
            <p
              className={`mb-3 font-mono text-xs uppercase tracking-widest ${
                item.highlight ? "font-bold text-foreground" : "text-muted"
              }`}
            >
              {item.year}
            </p>
            {item.title ? (
              <h3 className="mb-2 text-base font-semibold tracking-tight text-foreground md:text-lg">
                {item.title}
              </h3>
            ) : null}
            <p className="text-sm text-muted">{item.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
