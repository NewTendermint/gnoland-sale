import { FadeIn } from "./FadeIn"
import { Reveal } from "./Reveal"
import { RevealGroup } from "./RevealGroup"

type SectionHeadingProps = {
  eyebrow: string
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
      <FadeIn
        as="p"
        index={index}
        className={`mb-3 font-mono text-xs uppercase tracking-widest ${eyebrowColor}`}
      >
        {eyebrow}
      </FadeIn>
      <Reveal
        as="h2"
        type="words"
        index={index}
        className={`text-3xl font-bold uppercase leading-[1.05] tracking-tight md:text-4xl lg:text-5xl ${titleColor}`}
      >
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
