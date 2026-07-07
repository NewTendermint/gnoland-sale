"use client"

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
        <SectionHeading eyebrow="FAQ" title="Frequently Asked Questions (FAQ)" />
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
                    <div className="max-w-3xl space-y-3 pb-6 text-base text-muted md:text-lg lg:pb-8">
                      {(Array.isArray(item.a) ? item.a : [item.a]).map((para) => {
                        if (typeof para === "string") {
                          return <p key={para}>{para}</p>
                        }
                        if ("strong" in para) {
                          return (
                            <p key={para.strong} className="font-semibold text-foreground">
                              {para.strong}
                            </p>
                          )
                        }
                        const text = para.parts
                          .map((part) => (typeof part === "string" ? part : part.label))
                          .join("")
                        return (
                          <p key={text}>
                            {para.parts.map((part) =>
                              typeof part === "string" ? (
                                part
                              ) : (
                                <a
                                  key={part.href}
                                  href={part.href}
                                  className="link-underline text-foreground"
                                  {...(/^https?:/.test(part.href)
                                    ? { target: "_blank", rel: "noopener noreferrer" }
                                    : {})}
                                >
                                  {part.label}
                                </a>
                              ),
                            )}
                          </p>
                        )
                      })}
                    </div>
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
