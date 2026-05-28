import type { ReactNode } from "react"

type SectionProps = {
  id?: string
  tone?: "default" | "contrast"
  className?: string
  gridClassName?: string
  children: ReactNode
}

/** Page section scaffold: full-bleed band + centered container + 12-col grid. `tone="contrast"` wraps content in the inverted frame tile. `gridClassName` adds classes to the grid wrapper. */
export function Section({
  id,
  tone = "default",
  className = "",
  gridClassName = "",
  children,
}: SectionProps) {
  return (
    <section id={id} className={`bg-background py-14 text-foreground lg:py-20 ${className}`}>
      <div className="mx-auto max-w-[var(--max-width-container)] px-6 lg:px-8">
        {tone === "contrast" ? (
          <div className="rounded-[var(--frame-radius)] bg-surface-contrast py-12 text-on-contrast lg:py-16">
            <div className={`grid grid-cols-12 gap-6 ${gridClassName}`}>{children}</div>
          </div>
        ) : (
          <div className={`grid grid-cols-12 gap-6 ${gridClassName}`}>{children}</div>
        )}
      </div>
    </section>
  )
}
