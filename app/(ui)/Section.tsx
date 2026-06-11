import type { ReactNode } from "react"
import { ClipOpen } from "./ClipOpen"
import { RevealGroup } from "./RevealGroup"

/** Inverted framed surface (black tile in light theme / white in dark), minus
 * padding. Section's default contrast tile and any section building its own tile
 * (e.g. a taller pre-footer CTA) compose this so the frame stays identical. */
export const CONTRAST_TILE = "rounded-[var(--frame-radius)] bg-surface-contrast text-on-contrast"

type SectionProps = {
  id?: string
  tone?: "default" | "contrast"
  className?: string
  gridClassName?: string
  /** Clip-open the contrast tile so the black panel grows (top to bottom) as its
   * content reveals. Only meaningful with tone="contrast". */
  clip?: boolean
  children: ReactNode
}

/** Page section scaffold: full-bleed band + centered container + 12-col grid. `tone="contrast"` wraps content in the inverted frame tile. `clip` makes that tile grow with a clip-open. `gridClassName` adds classes to the grid wrapper. */
export function Section({
  id,
  tone = "default",
  className = "",
  gridClassName = "",
  clip = false,
  children,
}: SectionProps) {
  const grid = <div className={`grid grid-cols-12 gap-6 ${gridClassName}`}>{children}</div>
  const tileClass = `${CONTRAST_TILE} py-12 lg:py-16`
  return (
    <section id={id} className={`bg-background py-14 text-foreground lg:py-20 ${className}`}>
      <div className="mx-auto max-w-[var(--max-width-container)] px-6 lg:px-8">
        {tone === "contrast" ? (
          clip ? (
            // One timeline for the whole tile: the panel leads (clips open), then the
            // content reveal starts partway through that growth.
            <RevealGroup fromBottomPct={50}>
              <ClipOpen lead className={tileClass}>
                {grid}
              </ClipOpen>
            </RevealGroup>
          ) : (
            <div className={tileClass}>{grid}</div>
          )
        ) : (
          grid
        )}
      </div>
    </section>
  )
}
