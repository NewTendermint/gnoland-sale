import { DrawLine } from "./DrawLine"
import { Icon } from "./Icon"
import { ItemDivider } from "./ItemDivider"
import { ParallaxBox } from "./ParallaxBox"
import { Reveal } from "./Reveal"
import { RevealBoundary, RevealGroup } from "./RevealGroup"
import type { SceneVideoProps } from "./SceneVideo"
import { Section } from "./Section"
import { SectionHeading } from "./SectionHeading"

export type StatementItem = { icon: string; title: string; body: string }

type StatementListProps = {
  id: string
  eyebrow: string
  title: string
  items: StatementItem[]
  /** Scene video banner; takes precedence over `scene`. */
  sceneVideo?: SceneVideoProps
}

export function StatementList({ id, eyebrow, title, items, sceneVideo }: StatementListProps) {
  return (
    <Section id={id}>
      <RevealGroup inline staggerMs={150}>
        <div className="col-span-12 mb-10 lg:mb-24">
          <RevealBoundary>
            <ParallaxBox
              className="aspect-2/1 sm:aspect-3/1"
              strength={100}
              sceneVideo={sceneVideo}
            />
          </RevealBoundary>
        </div>

        <div className="col-span-12 grid grid-cols-10 gap-x-6 gap-y-0 lg:col-span-10 lg:col-start-2">
          <div className="col-span-10 lg:col-span-7">
            <SectionHeading eyebrow={eyebrow} title={title} index={0} />
          </div>

          <DrawLine className="col-span-10 mt-10 lg:mt-16" index={1} />

          <ul className="col-span-10 mt-6">
            {items.map((item, i) => (
              <RevealBoundary key={item.title}>
                <RevealGroup as="li" className="flex flex-col gap-6 py-6">
                  {i > 0 ? <ItemDivider /> : null}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-10 md:gap-6">
                    <div className="flex flex-row-reverse items-center justify-between gap-3 md:col-span-3 md:flex-row md:items-start md:self-start md:pr-4 md:pt-6">
                      <Icon
                        name={item.icon}
                        index={1}
                        className="h-9 w-9 shrink-0 text-foreground md:mr-4 md:h-12 md:w-12"
                      />
                      <Reveal
                        as="h3"
                        index={1}
                        className="text-left text-base font-bold uppercase leading-tight tracking-tight text-foreground md:text-right md:text-lg md:pt-1"
                      >
                        {item.title}
                      </Reveal>
                    </div>
                    <Reveal
                      as="p"
                      index={2}
                      className="text-2xl text-muted md:col-span-7 md:col-start-4 md:pt-6"
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
