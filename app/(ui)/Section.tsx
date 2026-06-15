import type { ReactNode } from "react"
import { ClipOpen } from "./ClipOpen"
import { RevealGroup } from "./RevealGroup"

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

/** Page section scaffold: a centered, padded 12-col grid (the centering + gutter +
 * max-width are folded onto the grid itself, no wrapper element). `tone="contrast"`
 * drops that grid inside the inverted frame tile, which is FULL-BLEED (spans the
 * whole .screen width); because only the grid carries the container width, the
 * contrast copy keeps the same left/right margins as the framed sections above and
 * below. `clip` makes that tile grow with a clip-open. `gridClassName` adds classes
 * to the grid. */
export function Section({
  id,
  tone = "default",
  className = "",
  gridClassName = "",
  clip = false,
  children,
}: SectionProps) {
  // Centering + gutter + max-width live ON the grid, so default sections need no
  // wrapper and contrast sections drop it straight into the full-bleed tile while
  // the copy still lands on the shared 12-col grid (same margins everywhere).
  const grid = (
    <div className={`page-container grid grid-cols-12 gap-6 ${gridClassName}`}>{children}</div>
  )
  const tileClass = "contrast-tile py-12 lg:py-16"
  return (
    <section id={id} className={`bg-background py-10 text-foreground lg:py-20 ${className}`}>
      {tone === "contrast" ? (
        clip ? (
          // One timeline for the whole tile: the panel leads (clips open), then the
          // content reveal starts partway through that growth. The tile is a direct
          // section child (no max-w wrapper) so it bleeds to the .screen edges.
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
