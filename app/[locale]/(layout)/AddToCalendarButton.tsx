"use client"

import { track } from "@/lib/analytics/track"
import { type SaleMilestone, buildMilestoneIcs } from "@/lib/sale/calendar"
import type { SaleTranslator } from "@/lib/sale/labels"
import { useTranslations } from "next-intl"
import { Icon } from "../(ui)/Icon"

/** The round icon-button language shared by the bar's secondary actions (calendar, Sonar
 *  sign-out): ring + fill-on-hover, "bar" on the light bar, "tile" on contrast surfaces. */
export const ROUND_ICON_BUTTON_VARIANTS = {
  bar: "inline-flex items-center justify-center rounded-full border border-border p-3 text-muted transition-colors duration-300 hover:border-surface-contrast hover:bg-surface-contrast hover:text-on-contrast",
  tile: "inline-flex items-center justify-center rounded-full border border-on-contrast/25 p-3 text-on-contrast transition-colors duration-300 hover:border-on-contrast hover:bg-on-contrast hover:text-surface-contrast",
} as const

const VARIANTS = ROUND_ICON_BUTTON_VARIANTS

export function AddToCalendarButton({
  milestone,
  variant,
}: {
  milestone: SaleMilestone
  variant: keyof typeof VARIANTS
}) {
  const t = useTranslations("Sale")
  function onClick() {
    track("add_to_calendar", { milestone, placement: variant })
    const { filename, ics } = buildMilestoneIcs(
      milestone,
      Date.now(),
      t as unknown as SaleTranslator,
    )
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
      aria-label={t("addToCalendar")}
      title={t("addToCalendar")}
      className={VARIANTS[variant]}
    >
      <Icon name="calendar" draw={false} className="h-5 w-5" />
    </button>
  )
}
