/**
 * Narrative. Default section on a 12-col grid (cols 2-11). Title spans
 * cols 2-11 top, prose paragraphs in cols 2-7 below (with the CTA link),
 * key stats in cols 9-11 right column. Colors flow from semantic theme
 * tokens so the section flips with the page theme.
 */
import { ArrowLink } from "../../(ui)/ArrowLink"
import { CountUp } from "../../(ui)/CountUp"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"

export function Narrative() {
  return (
    <Section id="narrative" gridClassName="mb-20 lg:mb-24">
      {/* Coordinated entrance: ONLY the About title + the two images share this
          timeline - the title reveals, then both images clip in 0.5s later (index 2 x
          staggerMs 250). The prose, figures and link below sit in RevealBoundary, so
          they keep their own scroll-in instead of joining this group. */}
      <RevealGroup inline staggerMs={250}>
        <div className="col-span-12 lg:col-span-6 lg:col-start-1">
          <ParallaxBox className="aspect-[4/5]" strength={60} index={2} />
          {/* Paragraph + key figures share ONE trigger so the figures count up just
            after the paragraph reveals. The group staggerMs is the gap before the
            figures (≈ the paragraph's reveal time); the 3 figures share index 1 so
            they fire together once that gap has passed. */}
          <RevealBoundary>
            <RevealGroup staggerMs={1100}>
              <Reveal as="p" className="mt-36 text-3xl leading-snug text-muted lg:text-4xl">
                Gno.land is a next-generation Layer 1 smart contract platform based on Gno, a
                deterministic, interpreted version of the Go programming language. Founded by Jae
                Kwon, co-founder of Cosmos and Tendermint, Gno.land represents a paradigm shift in
                multi-user programming. Our technology empowers developer communities to iteratively
                and interactively build a single shared program, enabling Gno.land to serve as the
                "GitHub" of the blockchain ecosystem.
              </Reveal>
              <RevealGroup as="dl" className="mt-12 grid grid-cols-3 gap-x-4 gap-y-6 lg:max-w-md">
                <div>
                  <dd className="font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl lg:text-4xl">
                    <CountUp value="150+" index={1} />
                  </dd>
                  <FadeIn
                    as="dt"
                    index={1}
                    className="mt-2 text-xs uppercase tracking-widest text-muted"
                  >
                    Contributors
                  </FadeIn>
                </div>
                <div className="border-l border-border pl-4">
                  <dd className="font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl lg:text-4xl">
                    <CountUp value="100+" index={1} />
                  </dd>
                  <FadeIn
                    as="dt"
                    index={1}
                    className="mt-2 text-xs uppercase tracking-widest text-muted"
                  >
                    Packages
                  </FadeIn>
                </div>
                <div className="border-l border-border pl-4">
                  <dd className="font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl lg:text-4xl">
                    <CountUp value="5+" index={1} />
                  </dd>
                  <FadeIn
                    as="dt"
                    index={1}
                    className="mt-2 text-xs uppercase tracking-widest text-muted"
                  >
                    Years building
                  </FadeIn>
                </div>
              </RevealGroup>
            </RevealGroup>
          </RevealBoundary>
        </div>
        <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pt-32">
          <RevealGroup>
            <SectionHeading
              eyebrow="About"
              title="The Open Knowledge Base for the New Millennium"
              index={0}
            />
            <ParallaxBox className="mt-48 aspect-[4/5] lg:w-4/5" strength={320} index={2} />
          </RevealGroup>
          <RevealBoundary>
            <DrawLine className="mt-64 lg:w-4/5" />
            <RevealGroup>
              <Reveal as="p" className="mt-6 text-2xl text-muted lg:w-4/5">
                With its familiar language and intuitive building processes, Gno.land reduces
                barriers for millions of Go developers, making Web3 more accessible while supporting
                applications that anyone can trust and use. In addition to its
                developer-friendliness, Gno.land is built with decentralization and
                censorship-resistance at its core. Under the leadership of GovDAO, the main
                decentralized governing body, and adhering to its Constitution, Gno.land is
                positioned to be the decentralized global knowledge base for the new millennium.
              </Reveal>
              <FadeIn as="div" className="mt-8">
                <ArrowLink href="https://docs.gno.land" label="Discover gno.land" variant="ghost" />
              </FadeIn>
            </RevealGroup>
          </RevealBoundary>
        </div>
      </RevealGroup>
    </Section>
  )
}
