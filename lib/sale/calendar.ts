import { SALE_ECONOMICS } from "./economics"
import type { SaleTranslator } from "./labels"

// Client-side ICS generation for the "add to calendar" buttons. Events are timed (UTC): the
// milestones sit at 22:00 UTC, so an all-day event pinned to the UTC date lands on the wrong
// local day for everyone east of UTC+2 - clients localize a timed DTSTART themselves.

export type SaleMilestone = "registration" | "sale"

const EVENTS: Record<
  SaleMilestone,
  { iso: string; summary: string; summaryKey: string; filename: string }
> = {
  registration: {
    iso: SALE_ECONOMICS.registrationOpensIso,
    summary: "GNOT sale registration opens",
    summaryKey: "calRegistrationSummary",
    filename: "gnot-registration-opens.ics",
  },
  sale: {
    iso: SALE_ECONOMICS.saleOpensIso,
    summary: "GNOT public sale opens",
    summaryKey: "calSaleSummary",
    filename: "gnot-sale-opens.ics",
  },
}

const EVENT_DURATION_MS = 3_600_000

/** Epoch ms -> "20260613T101530Z" (UTC date-time per RFC 5545). */
function icsStamp(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")
}

/** Build the one-event ICS for a milestone. `nowMs` is injected so the output is pure. The
 *  optional translator localizes the SUMMARY line; without it the English summary is used. */
export function buildMilestoneIcs(
  milestone: SaleMilestone,
  nowMs: number,
  t?: SaleTranslator,
): { filename: string; ics: string } {
  const event = EVENTS[milestone]
  const summary = t ? t(event.summaryKey) : event.summary
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//gno.land//GNOT Public Sale//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:gnot-${milestone}@sale.gno.land`,
    `DTSTAMP:${icsStamp(nowMs)}`,
    `DTSTART:${icsStamp(Date.parse(event.iso))}`,
    `DTEND:${icsStamp(Date.parse(event.iso) + EVENT_DURATION_MS)}`,
    `SUMMARY:${summary}`,
    "URL:https://sale.gno.land",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n")
  return { filename: event.filename, ics }
}
