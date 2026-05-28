/**
 * Partners. Mirrors the Narrative "About" pattern: 2 placeholder images
 * staggered diagonally (left big, right with title + image lower), then
 * 4 partner cards below as square-proportioned blocks, offset from the
 * left edge. Clean content, no tile backgrounds.
 */
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { partners } from "../../../content/sections/partners"

export function Partners() {
  return (
    <Section id="partners">
      <div className="col-span-12 lg:col-span-6 lg:col-start-1">
        <div className="aspect-[4/5] w-full rounded-[var(--frame-radius)] bg-surface-alt" />
      </div>

      <div className="col-span-12 lg:col-span-4 lg:col-start-8 lg:pt-32">
        <SectionHeading eyebrow="Partners" title="Working alongside" />
        <div className="mt-12 aspect-[4/5] w-full rounded-[var(--frame-radius)] bg-surface-alt" />
      </div>

      <ul className="col-span-12 mt-20 grid grid-cols-2 gap-6 lg:col-span-8 lg:col-start-3 lg:grid-cols-4">
        {partners.map((p, i) => (
          <li key={p.name} className={`aspect-square ${i === 2 ? "lg:col-start-1" : ""}`}>
            <div className="flex items-center gap-3">
              <div
                aria-label={`${p.name} logo placeholder`}
                className="size-8 shrink-0 rounded-md bg-surface-alt"
              />
              <h3 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                {p.name}
              </h3>
            </div>
            <p className="mt-3 text-xs leading-snug text-muted lg:text-sm">{p.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
