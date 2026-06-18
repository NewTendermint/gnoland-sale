"use client"

import { Icon } from "../(ui)/Icon"
import { type SaleMilestone, buildMilestoneIcs } from "../../lib/sale/calendar"

const VARIANTS = {
  bar: "inline-flex items-center justify-center rounded-full border border-border p-3 text-muted transition-colors duration-300 hover:border-surface-contrast hover:bg-surface-contrast hover:text-on-contrast",
  tile: "inline-flex items-center justify-center rounded-full border border-on-contrast/25 p-3 text-on-contrast transition-colors duration-300 hover:border-on-contrast hover:bg-on-contrast hover:text-surface-contrast",
} as const

export function AddToCalendarButton({
  milestone,
  variant,
}: {
  milestone: SaleMilestone
  variant: keyof typeof VARIANTS
}) {
  function onClick() {
    const { filename, ics } = buildMilestoneIcs(milestone, Date.now())
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add the date to your calendar"
      title="Add the date to your calendar"
      className={VARIANTS[variant]}
    >
      <Icon name="calendar" draw={false} className="h-5 w-5" />
    </button>
  )
}
