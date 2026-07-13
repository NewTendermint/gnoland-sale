import { sceneVideos } from "@/lib/scenes"
import { useTranslations } from "next-intl"
import { CountUp } from "../../(ui)/CountUp"
import { Cta } from "../../(ui)/Cta"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { ParallaxBox } from "../../(ui)/ParallaxBox"
import { Reveal } from "../../(ui)/Reveal"
import { RevealBoundary, RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"

export function Narrative() {
  const t = useTranslations("Narrative")
  const projectHeading = {
    eyebrow: t("eyebrow"),
    title: t("title"),
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
                {t("para1")}
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
                    {t("contributors")}
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
                    {t("packages")}
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
                    {t("yearsBuilding")}
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
                {t("para2")}
              </Reveal>
              <FadeIn as="div" className="mt-8">
                <Cta
                  href="https://docs.gno.land"
                  external
                  arrow="diagonal"
                  label={t("cta")}
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
