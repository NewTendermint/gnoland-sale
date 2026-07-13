import { team } from "@/content/sections/team"
import { useTranslations } from "next-intl"
import { Fragment } from "react"
import { DrawLine } from "../../(ui)/DrawLine"
import { FadeIn } from "../../(ui)/FadeIn"
import { Reveal } from "../../(ui)/Reveal"
import { RevealGroup } from "../../(ui)/RevealGroup"
import { Section } from "../../(ui)/Section"
import { SectionHeading } from "../../(ui)/SectionHeading"

export function Team() {
  const t = useTranslations("Team")
  return (
    <Section id="team">
      <RevealGroup
        as="div"
        className="col-span-12 mb-12 flex flex-col items-center text-center lg:col-span-6 lg:col-start-4 lg:mb-16"
      >
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <Reveal as="p" className="mt-4 max-w-xl text-base text-muted md:text-lg">
          {t("lead")}
        </Reveal>
      </RevealGroup>

      <DrawLine className="band-10" />
      <ul className="band-10">
        {team.map((p) => (
          <Fragment key={p.name}>
            <FadeIn as="li" className="py-6 text-center lg:py-8">
              <h3 className="text-3xl font-bold uppercase leading-[1.05] tracking-tight text-foreground md:text-4xl lg:text-5xl">
                {p.name}
              </h3>
              <p className="mt-3 font-mono text-xs uppercase tracking-widest text-muted lg:text-sm">
                {t(`${p.id}.bio`)}
              </p>
            </FadeIn>
            <DrawLine as="li" />
          </Fragment>
        ))}
      </ul>
    </Section>
  )
}
