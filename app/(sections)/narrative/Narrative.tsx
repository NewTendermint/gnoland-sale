import { CountUp } from "../../(ui)/CountUp"
import { Cta } from "../../(ui)/Cta"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"
import { sceneVideos } from "../../../lib/scenes"

export function Narrative() {
  const projectHeading = {
    eyebrow: "Project",
    title: "The Open Knowledge Base for the New Millennium",
  }
  return (
    <Section id="narrative">
      <RevealGroup inline staggerMs={250}>
        <div className="order-first col-span-12 lg:hidden">
          <SectionHeading eyebrow={projectHeading.eyebrow} title={projectHeading.title} index={0} />
        </div>
        <div className="col-span-12 lg:col-span-6 lg:col-start-1">
          <RevealBoundary>
            <ParallaxBox
              className="aspect-[3/2] lg:aspect-[4/5]"
              strength={60}
              sceneVideo={sceneVideos.narrativeA}
            />
          </RevealBoundary>
          <RevealBoundary>
            <RevealGroup staggerMs={1100}>
              <Reveal
                as="p"
                className="mt-14 text-3xl leading-snug text-muted lg:mt-36 lg:text-4xl"
              >
                Gno.land, developed by NewTendermint, is a next-generation smart contract platform
                built on Gno, a Go-based interpreted language that lets developers build secure,
                expressive on-chain applications using one of the world's most popular programming
                languages. Founded by Jae Kwon, co-founder of Cosmos and Tendermint, Gno.land
                represents a paradigm shift in multi-user programming. Unlike traditional blockchain
                environments that require a learning curve, Gno.land meets developers where they
                already are, dramatically lowering the barrier to entry while maintaining the
                performance and clarity Go is known for.
              </Reveal>
              {/* flex-col-reverse: a dt must precede its dd in the DOM (screen readers pair them
                  by source order) while the value stays visually above the label. */}
              <RevealGroup as="dl" className="mt-12 grid grid-cols-3 gap-x-6 gap-y-6 lg:max-w-md">
                <div className="flex flex-col-reverse">
                  <FadeIn
                    as="dt"
                    index={1}
                    className="mt-2 text-xs uppercase tracking-widest text-muted"
                  >
                    Contributors
                  </FadeIn>
                  <dd className="font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl lg:text-4xl">
                    <CountUp value="150+" index={1} />
                  </dd>
                </div>
                <div className="flex flex-col-reverse border-l border-border pl-4">
                  <FadeIn
                    as="dt"
                    index={1}
                    className="mt-2 text-xs uppercase tracking-widest text-muted"
                  >
                    Packages
                  </FadeIn>
                  <dd className="font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl lg:text-4xl">
                    <CountUp value="1K+" index={1} />
                  </dd>
                </div>
                <div className="flex flex-col-reverse border-l border-border pl-4">
                  <FadeIn
                    as="dt"
                    index={1}
                    className="mt-2 text-xs uppercase tracking-widest text-muted"
                  >
                    Years building
                  </FadeIn>
                  <dd className="font-mono text-2xl font-bold tabular-nums text-foreground md:text-3xl lg:text-4xl">
                    <CountUp value="5+" index={1} />
                  </dd>
                </div>
              </RevealGroup>
            </RevealGroup>
          </RevealBoundary>
        </div>
        <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:pt-32">
          <RevealGroup>
            <div className="hidden lg:block">
              <SectionHeading
                eyebrow={projectHeading.eyebrow}
                title={projectHeading.title}
                index={0}
              />
            </div>
            <RevealBoundary>
              <ParallaxBox
                className="mt-10 hidden aspect-[4/5] lg:mt-48 lg:block lg:w-4/5"
                strength={320}
                sceneVideo={sceneVideos.narrativeB}
              />
            </RevealBoundary>
          </RevealGroup>
          <RevealBoundary>
            <DrawLine className="mt-10 hidden lg:mt-64 lg:block lg:w-4/5" />
            <RevealGroup staggerMs={1500}>
              <Reveal as="p" className="mt-6 text-2xl text-muted lg:w-4/5">
                At its core, Gno.land is designed for transparency, security, and long-term
                composability. All smart contracts are fully on-chain, human-readable, and
                permanently verifiable, meaning anyone can audit, fork, or build on top of existing
                code without trust assumptions. Combined with a fair, community-driven governance
                model and a tokenomics structure designed for sustainable growth, Gno.land is
                building the foundation for a more open and accountable decentralized internet.
              </Reveal>
              <FadeIn as="div" className="mt-8">
                <Cta
                  href="https://docs.gno.land"
                  external
                  arrow="diagonal"
                  label="Discover Gno.land"
                  variant="ghost"
                  size="sm"
                />
              </FadeIn>
            </RevealGroup>
          </RevealBoundary>
        </div>
      </RevealGroup>
    </Section>
  )
}
