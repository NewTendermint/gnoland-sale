import { FadeIn } from "./FadeIn"
import { Reveal } from "./Reveal"
import { RevealGroup } from "./RevealGroup"

/** The h2 type ramp, shared with custom heading layouts. */
export const HEADING_TITLE =
  "text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  lead?: string
  tone?: "default" | "contrast"
  index?: number
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "default",
  index,
}: SectionHeadingProps) {
  const eyebrowColor = tone === "contrast" ? "text-on-contrast-muted" : "text-muted"
  const titleColor = tone === "contrast" ? "text-on-contrast" : "text-foreground"
  const leadColor = tone === "contrast" ? "text-on-contrast-muted" : "text-muted"
  return (
    <RevealGroup>
      {eyebrow ? (
        <FadeIn as="p" index={index} className={`mb-3 section-eyebrow ${eyebrowColor}`}>
          {eyebrow}
        </FadeIn>
      ) : null}
      <Reveal as="h2" type="words" index={index} className={`${HEADING_TITLE} ${titleColor}`}>
        {title}
      </Reveal>
      {lead ? (
        <Reveal as="p" index={index} className={`mt-6 text-lg md:text-xl ${leadColor}`}>
          {lead}
        </Reveal>
      ) : null}
    </RevealGroup>
  )
}
