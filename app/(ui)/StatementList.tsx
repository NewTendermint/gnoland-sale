import { DrawLine } from "./DrawLine"
import { Icon } from "./Icon"
import { ItemDivider } from "./ItemDivider"
import { ParallaxBox } from "./ParallaxBox"
import { Reveal } from "./Reveal"
import { RevealBoundary, RevealGroup } from "./RevealGroup"
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
        {/* Full-width image banner - its OWN scroll trigger (RevealBoundary), so it
            clips open on its own and the title below is NOT chained to it. mb-24
            clearance so the box's float never rides onto the title. */}
        <div className="col-span-12 mb-10 lg:mb-24">
          <RevealBoundary>
            <ParallaxBox className="aspect-2/1 sm:aspect-3/1" strength={100} />
          </RevealBoundary>
        </div>

        {/* Centered 10-col band. The title block (eyebrow + title + its rule) is the
            top member of this group, so the group triggers off the TITLE - it reveals
            as a block on its own scroll position, not chained to the banner above. */}
        <div className="col-span-12 grid grid-cols-10 gap-x-6 gap-y-0 lg:col-span-10 lg:col-start-2">
          <div className="col-span-10 lg:col-span-7">
            <SectionHeading eyebrow={eyebrow} title={title} index={0} />
          </div>

          <DrawLine className="col-span-10 mt-10 lg:mt-16" index={1} />

          <ul className="col-span-10 mt-6">
            {items.map((item, i) => (
              // Each item leaves the title group (RevealBoundary) and gets its OWN
              // scroll trigger, so the list reveals one item at a time as you reach it.
              // Inside the item's cascade: the divider draws (slot 0, like the rule and
              // the top table), the icon draws + title rises (slot 1), then the body
              // rises (slot 2) - same genres as everywhere else, sequenced per item.
              <RevealBoundary key={item.title}>
                <RevealGroup as="li" className="flex flex-col gap-6 py-6">
                  {i > 0 ? <ItemDivider /> : null}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-10 md:gap-6">
                    {/* Title cell: on mobile the title leads on the left (a touch
                        larger) with the icon to its right; from md the desktop order
                        returns (icon in the left gutter, title right-aligned against
                        the body). From md the icon + title top-align (items-start) on
                        the body's first line (shared md:pt-6) so a title that wraps to
                        two lines keeps its top on the paragraph instead of drifting up. */}
                    <div className="flex flex-row-reverse items-center justify-between gap-3 md:col-span-3 md:flex-row md:items-start md:self-start md:pr-4 md:pt-6">
                      <Icon
                        name={item.icon}
                        index={1}
                        // md:mr-2 keeps a fixed gap to the right of the icon (desktop
                        // only) so a long title that wraps never collides with it.
                        className="h-10 w-10 shrink-0 text-foreground md:mr-2 md:h-12 md:w-12"
                      />
                      <Reveal
                        as="h3"
                        index={1}
                        // md:pt-1.5 nudges the small uppercase title down so its cap top
                        // lands on the body's first-line cap top (the larger text-2xl
                        // body sits lower in its line box than the tiny text-xs title).
                        className="text-left text-base font-bold uppercase leading-tight tracking-tight text-foreground md:text-right md:text-xs md:pt-1.5"
                      >
                        {item.title}
                      </Reveal>
                    </div>
                    <Reveal
                      as="p"
                      index={2}
                      className="text-2xl text-foreground md:col-span-7 md:col-start-4 md:pt-6"
                    >
                      {item.body}
                    </Reveal>
                  </div>
                </RevealGroup>
              </RevealBoundary>
            ))}
          </ul>
        </div>
      </RevealGroup>
    </Section>
  )
}
