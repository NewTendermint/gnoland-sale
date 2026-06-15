import { FadeIn } from "./FadeIn"
import { Reveal } from "./Reveal"
import { RevealGroup } from "./RevealGroup"

/** The h2 type ramp. Single source so sections that build a custom heading layout
 * (centered, with a status prefix, width-constrained lead) stay on the same scale. */
export const HEADING_TITLE =
  "text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  lead?: string
  tone?: "default" | "contrast"
  /** Fixed cascade slot when this heading sits inside a wider RevealGroup - lets the
   * parent place the whole title at one point in its timeline (e.g. title first, then
   * the tiles 0.5s later). Omit to let eyebrow -> title -> lead cascade on their own. */
  index?: number
}

/** Standard section heading: mono eyebrow + uppercase h2 + optional lead paragraph.
 * Wrapped in a RevealGroup so eyebrow -> title -> lead reveal as ONE coordinated
 * cascade (single scroll trigger, top to bottom) instead of each firing on its own.
 * Inside a wider RevealGroup it flattens, joining that block's cascade. */
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
