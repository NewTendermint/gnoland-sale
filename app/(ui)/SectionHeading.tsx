type SectionHeadingProps = {
  eyebrow: string
  title: string
  lead?: string
  tone?: "default" | "contrast"
}

/** Standard section heading: mono eyebrow + uppercase h2 + optional lead paragraph. */
export function SectionHeading({ eyebrow, title, lead, tone = "default" }: SectionHeadingProps) {
  const eyebrowColor = tone === "contrast" ? "text-on-contrast-muted" : "text-muted"
  const titleColor = tone === "contrast" ? "text-on-contrast" : "text-foreground"
  const leadColor = tone === "contrast" ? "text-on-contrast-muted" : "text-muted"
  return (
    <>
      <p className={`mb-3 font-mono text-xs uppercase tracking-widest ${eyebrowColor}`}>
        {eyebrow}
      </p>
      <h2
        className={`text-3xl font-bold uppercase leading-[1.05] tracking-tight md:text-4xl lg:text-5xl ${titleColor}`}
      >
        {title}
      </h2>
      {lead ? <p className={`mt-6 text-lg md:text-xl ${leadColor}`}>{lead}</p> : null}
    </>
  )
}
