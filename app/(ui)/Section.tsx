import type { ReactNode } from "react"
import { ClipOpen } from "./ClipOpen"
import { RevealGroup } from "./RevealGroup"

type SectionProps = {
  id?: string
  tone?: "default" | "contrast"
  className?: string
  gridClassName?: string
  clip?: boolean
  children: ReactNode
}

export function Section({
  id,
  tone = "default",
  className = "",
  gridClassName = "",
  clip = false,
  children,
}: SectionProps) {
  const grid = (
    <div className={`page-container grid grid-cols-12 gap-6 ${gridClassName}`}>{children}</div>
  )
  const tileClass = "contrast-tile py-12 lg:py-16"
  return (
    <section id={id} className={`bg-background py-10 text-foreground lg:py-20 ${className}`}>
      {tone === "contrast" ? (
        clip ? (
          <RevealGroup fromBottomPct={40}>
            <ClipOpen lead durationMs={2200} className={tileClass}>
              {grid}
            </ClipOpen>
          </RevealGroup>
        ) : (
          <div className={tileClass}>{grid}</div>
        )
      ) : (
        grid
      )}
    </section>
  )
}
