import { DrawLine } from "./DrawLine"

export function ItemDivider() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-10 md:gap-6">
      <DrawLine index={0} colorClass="bg-foreground/10" className="md:col-span-7 md:col-start-4" />
    </div>
  )
}
