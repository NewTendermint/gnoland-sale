import { BlueprintLoop } from "../../(ui)/BlueprintLoop"
import { ClipOpen } from "../../(ui)/ClipOpen"
import { FadeIn } from "../../(ui)/FadeIn"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { items } from "../../../content/sections/roadmap"

export function Roadmap() {
  return (
    <section id="roadmap" className="bg-background py-10 text-foreground lg:py-20">
      <RevealGroup fromBottomPct={40}>
        <ClipOpen
          lead
          durationMs={2200}
          className="contrast-tile relative overflow-hidden py-12 lg:pb-16 lg:pt-0"
        >
          <div className="page-container">
            <div className="grid grid-cols-12 gap-6">
              <div className="relative col-span-12">
                <BlueprintLoop />
                <div className="absolute inset-0 z-10 flex items-center justify-center text-center">
                  <SectionHeading
                    tone="contrast"
                    eyebrow="Roadmap"
                    title="From Bootstrap to Mainnet"
                    index={0}
                  />
                </div>
              </div>

              <RevealBoundary>
                <RevealGroup
                  as="ol"
                  staggerMs={250}
                  className="col-span-12 mt-4 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:col-span-10 lg:col-start-2 lg:grid-cols-4"
                >
                  {items.map((item, i) => {
                    const rowDelayMs = i < 4 ? 0 : 240
                    return (
                      <RevealGroup as="li" key={item.year}>
                        <FadeIn
                          as="p"
                          index={0}
                          delayMs={rowDelayMs}
                          className={`mb-0.5 font-mono text-base leading-tight tracking-tight text-on-contrast md:text-lg ${
                            item.highlight ? "font-bold" : "font-semibold"
                          }`}
                        >
                          {item.year}
                        </FadeIn>
                        {item.title ? (
                          <Reveal
                            as="h3"
                            index={1}
                            delayMs={rowDelayMs}
                            className="mb-3 text-base font-semibold leading-tight tracking-tight text-on-contrast-muted md:text-lg"
                          >
                            {item.title}
                          </Reveal>
                        ) : null}
                        <Reveal
                          as="p"
                          index={2}
                          delayMs={rowDelayMs}
                          className="text-sm text-on-contrast-muted"
                        >
                          {item.body}
                        </Reveal>
                      </RevealGroup>
                    )
                  })}
                </RevealGroup>
              </RevealBoundary>
            </div>
          </div>
        </ClipOpen>
      </RevealGroup>
    </section>
  )
}
