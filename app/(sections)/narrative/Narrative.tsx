/** Narrative ("About") section: prose + key stats + docs link. */
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
  // Single source for the About heading copy: rendered once per breakpoint - the
  // mobile copy leads the section, the desktop copy stays in the right column. Only
  // one is ever visible, so the text is never read twice.
  const aboutHeading = {
    eyebrow: "About",
    title: "The Open Knowledge Base for the New Millennium",
  }
  return (
    <Section id="narrative">
      {/* The About title reveals on this group's trigger. The two images are NOT in
          the group: each sits in its own RevealBoundary so it clips open on its OWN
          scroll trigger (when YOU reach it), instead of both firing together 0.5s after
          the title - the lower image used to open far below the fold, unseen. The prose,
          figures and link below also sit in RevealBoundary with their own scroll-in. */}
      <RevealGroup inline staggerMs={250}>
        {/* Mobile: the title leads the section; desktop keeps it in the right column
            below. order-first + lg:hidden swap which copy shows. */}
        <div className="order-first col-span-12 lg:hidden">
          <SectionHeading eyebrow={aboutHeading.eyebrow} title={aboutHeading.title} index={0} />
        </div>
        <div className="col-span-12 lg:col-span-6 lg:col-start-1">
          <RevealBoundary>
            <ParallaxBox className="aspect-[3/2] lg:aspect-[4/5]" strength={60} />
          </RevealBoundary>
          {/* Paragraph + key figures share ONE trigger so the figures count up just
            after the paragraph reveals. The group staggerMs is the gap before the
            figures (≈ the paragraph's reveal time); the 3 figures share index 1 so
            they fire together once that gap has passed. */}
          <RevealBoundary>
            <RevealGroup staggerMs={1100}>
              <Reveal
                as="p"
                className="mt-14 text-3xl leading-snug text-muted lg:mt-36 lg:text-4xl"
              >
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
            {/* Desktop keeps the title here; hidden on mobile (the copy above leads). */}
            <div className="hidden lg:block">
              <SectionHeading eyebrow={aboutHeading.eyebrow} title={aboutHeading.title} index={0} />
            </div>
            {/* Second image dropped on mobile so the paragraph below follows the key
                figures directly. */}
            <RevealBoundary>
              <ParallaxBox
                className="mt-10 hidden aspect-[4/5] lg:mt-48 lg:block lg:w-4/5"
                strength={320}
              />
            </RevealBoundary>
          </RevealGroup>
          <RevealBoundary>
            <DrawLine className="mt-10 hidden lg:mt-64 lg:block lg:w-4/5" />
            {/* staggerMs sets when the "Discover gno.land" link starts relative to the
                paragraph above. The paragraph reveals over ~2s at desktop width (~15
                lines x 85ms + 800ms); 1500 starts the link during its tail (last lines
                still arriving) so it reads as following the text without the full wait.
                Higher = clearly after with a gap; lower (down to ~1390) = finishes
                together with the text. Feel value - tune freely. */}
            <RevealGroup staggerMs={1500}>
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
                {/* external: a same-tab docs navigation mid-page is a funnel exit. */}
                <ArrowLink
                  href="https://docs.gno.land"
                  external
                  label="Discover gno.land"
                  variant="ghost"
                />
              </FadeIn>
            </RevealGroup>
          </RevealBoundary>
        </div>
      </RevealGroup>
    </Section>
  )
}
