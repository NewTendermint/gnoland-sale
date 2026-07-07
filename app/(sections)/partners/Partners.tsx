"use client"

import { useState } from "react"
import { Cta } from "../../(ui)/Cta"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { partners } from "../../../content/sections/partners"
import { sceneVideos } from "../../../lib/scenes"

export function Partners() {
  const heading = { eyebrow: "Partners", title: "Our Collaborators" }
  const [open, setOpen] = useState<number | null>(null)
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
            {partners.map((p, i) => {
              const isOpen = open === i
              return (
                <RevealBoundary key={p.name}>
                  <RevealGroup as="li" className={i > 0 ? "mt-8" : ""}>
                    {i > 0 ? (
                      <DrawLine index={0} colorClass="bg-foreground/10" className="mb-8" />
                    ) : null}
                    <Reveal
                      as="h3"
                      index={1}
                      className="text-lg font-semibold leading-tight tracking-tight text-foreground"
                    >
                      {p.href ? (
                        <a
                          href={p.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="link-underline"
                        >
                          {p.name}
                        </a>
                      ) : (
                        p.name
                      )}
                    </Reveal>
                    <Reveal as="p" index={2} className="mt-3 text-xl leading-snug text-muted">
                      {p.body}
                    </Reveal>
                    {p.team.length > 0 ? (
                      <FadeIn as="div" index={3} className="mt-5">
                        <Cta
                          onClick={() => setOpen(isOpen ? null : i)}
                          ariaExpanded={isOpen}
                          ariaControls={`partner-team-${i}`}
                          variant="ghost"
                          size="xs"
                        >
                          Meet the team ({p.team.length})
                          <svg
                            viewBox="0 0 16 16"
                            aria-hidden="true"
                            className={`h-3 w-3 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
                              isOpen ? "rotate-45" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M8 1v14M1 8h14" strokeLinecap="round" />
                          </svg>
                        </Cta>
                        <div
                          id={`partner-team-${i}`}
                          className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                        >
                          <div className="overflow-hidden" inert={!isOpen}>
                            <ul className="pt-4">
                              {p.team.map((m) => (
                                <li
                                  key={m.name}
                                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-foreground/10 py-3 text-sm last:border-b-0"
                                >
                                  <span className="font-semibold text-foreground">{m.name}</span>
                                  <span className="text-muted">{m.role}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </FadeIn>
                    ) : null}
                  </RevealGroup>
                </RevealBoundary>
              )
            })}
          </ul>
        </div>

        <div className="col-span-12 lg:col-span-4 lg:col-start-8 lg:pt-32">
          <div className="hidden lg:block">
            <SectionHeading eyebrow={heading.eyebrow} title={heading.title} index={0} />
          </div>
          <RevealBoundary>
            <ParallaxBox
              className="mt-4 aspect-[3/2] lg:mt-64 lg:aspect-[4/5]"
              strength={320}
              sceneVideo={sceneVideos.partnersB}
            />
          </RevealBoundary>
        </div>
      </RevealGroup>
    </Section>
  )
}
