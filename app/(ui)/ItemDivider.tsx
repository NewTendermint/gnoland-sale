import { DrawLine } from "./DrawLine"

/**
 * Drawn divider above a list item (statement / ecosystem rows): full width on mobile,
 * offset to the body column (cols 4-10) on desktop so it never crosses the icon gutter
 * - unlike the full-width rule under a section title. Sits at cascade slot 0 so it
 * draws first when its item's RevealGroup fires.
 */
export function ItemDivider() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-10 md:gap-6">
      <DrawLine index={0} colorClass="bg-foreground/10" className="md:col-span-7 md:col-start-4" />
    </div>
  )
}
