"use client"

/**
 * FAQ. Credits-list layout borrowed from Team (hairline-separated rows under a
 * centered heading), but each row is an accordion: the question is a full-width
 * button, the answer expands with the grid-rows 0fr -> 1fr trick (the same
 * motion as the sticky bar's sheet; no transition under prefers-reduced-motion)
 * and a "+" indicator rotates into a close cross. Single-open: opening a row
 * collapses the previous one, so the page height stays controlled. Collapsed
 * answers are `inert` (out of the tab order) and wired with aria-expanded /
 * aria-controls for assistive tech.
 */
import { Fragment, useState } from "react"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { faq } from "../../../content/sections/faq"

export function Faq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <Section id="faq">
      <RevealGroup
        as="div"
        className="col-span-12 mb-12 flex flex-col items-center text-center lg:col-span-6 lg:col-start-4 lg:mb-16"
      >
        <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
      </RevealGroup>

      <DrawLine className="band-10" />
      <ul className="band-10">
        {faq.map((item, i) => {
          const isOpen = open === i
          return (
            <Fragment key={item.q}>
              <FadeIn as="li">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left lg:py-8"
                  >
                    <span className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {item.q}
                    </span>
                    {/* "+" rotates into a close cross when open. */}
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 group-hover:text-foreground motion-reduce:transition-none ${
                        isOpen ? "rotate-45" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M8 1v14M1 8h14" strokeLinecap="round" />
                    </svg>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden" inert={!isOpen}>
                    <p className="max-w-3xl pb-6 text-base text-muted md:text-lg lg:pb-8">
                      {item.a}
                    </p>
                  </div>
                </div>
              </FadeIn>
              <DrawLine as="li" />
            </Fragment>
          )
        })}
      </ul>
    </Section>
  )
}
