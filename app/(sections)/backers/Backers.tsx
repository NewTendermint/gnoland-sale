import { ClipOpen } from "../../(ui)/ClipOpen"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { backers } from "../../../content/sections/backers"

// Real SVG (never the U+2197 char, which Windows substitutes with a color emoji).
function UpRightArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 lg:h-5 lg:w-5"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

export function Backers() {
  return (
    <Section id="backers">
      <DrawLine className="band-10" />

      <RevealGroup
        as="div"
        className="col-span-12 my-12 flex flex-col items-center text-center lg:col-span-6 lg:col-start-4 lg:my-16"
      >
        <SectionHeading eyebrow="Backers" title="Our Backers" />
      </RevealGroup>

      <ul className="band-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-8 pb-12 lg:gap-x-20 lg:pb-16">
        {backers.map((b) => (
          <RevealBoundary key={b.name}>
            <FadeIn as="li">
              <a
                href={b.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex flex-col items-center gap-5 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl"
              >
                {b.logo ? (
                  <ClipOpen
                    durationMs={700}
                    className="flex h-11 w-28 items-center justify-center [--frame-radius:0px] lg:h-12 lg:w-32"
                  >
                    <img
                      src={b.logo}
                      alt={b.name}
                      loading="lazy"
                      className={`max-h-full max-w-full object-contain opacity-60 brightness-0 transition-opacity group-hover:opacity-100 dark:invert${b.logoClass ? ` ${b.logoClass}` : ""}`}
                    />
                  </ClipOpen>
                ) : null}
                <span className="inline-flex items-center gap-2">
                  <span className="link-underline link-underline-group">{b.name}</span>
                  <UpRightArrow />
                </span>
              </a>
            </FadeIn>
          </RevealBoundary>
        ))}
      </ul>

      <DrawLine className="band-10" />
    </Section>
  )
}
