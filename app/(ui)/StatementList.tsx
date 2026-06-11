import { DrawLine } from "./DrawLine"
import { Icon } from "./Icon"
import { ParallaxBox } from "./ParallaxBox"
import { Reveal } from "./Reveal"
import { RevealGroup } from "./RevealGroup"
import { Section } from "./Section"
import { SectionHeading } from "./SectionHeading"

export type StatementItem = { icon: string; title: string; body: string }

type StatementListProps = {
  id: string
  eyebrow: string
  title: string
  items: StatementItem[]
}

/**
 * Editorial "statement" section (Cuberto-style): a full-width 12-col image banner,
 * then a centered 10-col band with a left-aligned title, a full-width animated rule,
 * and the items as table-style rows (icon + title in the left gutter, body offset to
 * cols 4-10 with a hairline above each). One coordinated entrance off the banner:
 * banner 0, title 1, rule 2, then the rows cascade (3 + i). Shared by the Features
 * and GNOT-utility sections.
 */
export function StatementList({ id, eyebrow, title, items }: StatementListProps) {
  return (
    <Section id={id}>
      <RevealGroup inline staggerMs={150}>
        {/* Full-width image banner. Gentle parallax + mb-24 clearance so the box's
            float never rides onto the title below. */}
        <div className="col-span-12 mb-24">
          <ParallaxBox className="aspect-[3/1]" strength={100} index={0} />
        </div>

        {/* Centered 10-col band with its own true 10-col grid (child math in tenths). */}
        <div className="col-span-12 grid grid-cols-10 gap-x-6 gap-y-0 lg:col-span-10 lg:col-start-2">
          <div className="col-span-10 lg:col-span-7">
            <SectionHeading eyebrow={eyebrow} title={title} index={1} />
          </div>

          <DrawLine className="col-span-10 mt-16" index={2} />

          <ul className="col-span-10 mt-6">
            {items.map((item, i) => (
              <RevealGroup
                as="li"
                key={item.title}
                className={`grid grid-cols-1 gap-2 py-6 md:grid-cols-10 md:gap-6 ${
                  i > 0 ? " border-t border-foreground/10 md:border-t-0" : ""
                }`}
              >
                {/* Title cell: icon + title; the icon top-aligns with the body's first
                    line (md:pt-4 against the body's md:pt-6 rule + padding). */}
                <div className="flex items-center justify-between gap-3 md:col-span-3 md:self-start md:pr-4 md:pt-4">
                  <Icon
                    name={item.icon}
                    index={3 + i}
                    className="h-12 w-12 shrink-0 text-foreground"
                  />
                  <Reveal
                    as="h3"
                    index={3 + i}
                    className="text-right text-xs font-bold uppercase leading-tight tracking-tight text-foreground"
                  >
                    {item.title}
                  </Reveal>
                </div>
                <Reveal
                  as="p"
                  index={3 + i}
                  className={`text-2xl text-foreground md:col-span-7 md:col-start-4 md:pt-6 ${
                    i > 0 ? "md:border-t md:border-foreground/10" : ""
                  }`}
                >
                  {item.body}
                </Reveal>
              </RevealGroup>
            ))}
          </ul>
        </div>
      </RevealGroup>
    </Section>
  )
}
