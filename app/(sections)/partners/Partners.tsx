import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { partners } from "../../../content/sections/partners"
import { sceneVideos } from "../../../lib/scenes"

export function Partners() {
  const heading = { eyebrow: "Partners", title: "Our Collaborators" }
  return (
    <Section id="partners" className="pb-0 lg:pb-0">
      <RevealGroup inline staggerMs={250}>
        <div className="order-first col-span-12 lg:hidden">
          <SectionHeading eyebrow={heading.eyebrow} title={heading.title} index={0} />
        </div>
        <div className="col-span-12 grid grid-cols-1 gap-y-12 lg:col-span-6 lg:col-start-1 lg:grid-cols-6 lg:gap-y-32">
          <div className="lg:col-span-6">
            <RevealBoundary>
              <ParallaxBox
                className="aspect-[3/2] lg:aspect-[4/5]"
                strength={90}
                sceneVideo={sceneVideos.partnersA}
              />
            </RevealBoundary>
          </div>

          <ul className="lg:col-span-5 lg:col-start-2">
            {partners.map((p, i) => (
              <RevealBoundary key={p.name}>
                <RevealGroup as="li" className={i > 0 ? "mt-8" : ""}>
                  <Reveal
                    as="h3"
                    index={0}
                    className="text-lg font-semibold leading-tight tracking-tight text-foreground"
                  >
                    {p.name}
                  </Reveal>
                  <Reveal as="p" index={1} className="mt-3 text-xl leading-snug text-foreground">
                    {p.body}
                  </Reveal>
                </RevealGroup>
              </RevealBoundary>
            ))}
          </ul>
        </div>

        <div className="col-span-12 lg:col-span-4 lg:col-start-8 lg:pt-32">
          <div className="hidden lg:block">
            <SectionHeading eyebrow={heading.eyebrow} title={heading.title} index={0} />
          </div>
          <RevealBoundary>
            <ParallaxBox
              className="mt-4 aspect-[3/2] lg:mt-48 lg:aspect-[4/5]"
              strength={320}
              sceneVideo={sceneVideos.partnersB}
            />
          </RevealBoundary>
        </div>
      </RevealGroup>
    </Section>
  )
}
