import { SALE_ECONOMICS } from "./economics"

/**
 * Client-side ICS generation for the "add to calendar" buttons. A downloaded
 * .ics is universal (Apple / Google / Outlook import it), sends nothing to any
 * third party, and needs no dependency: the file is a dozen lines of text.
 *
 * Events are ALL-DAY on purpose: the exact opening time is still TBD
 * (REQUIREMENTS A.12.2 / param #14), and a timed 00:00 UTC event would render
 * as a misleading local time (02:00 in Paris). An all-day event is honest and
 * timezone-proof; the reminder emails carry the precise time once known.
 */

export type SaleMilestone = "registration" | "sale"

const EVENTS: Record<SaleMilestone, { iso: string; summary: string; filename: string }> = {
  registration: {
    iso: SALE_ECONOMICS.registrationOpensIso,
    summary: "GNOT sale registration opens",
    filename: "gnot-registration-opens.ics",
  },
  sale: {
    iso: SALE_ECONOMICS.saleOpensIso,
    summary: "GNOT public sale opens",
    filename: "gnot-sale-opens.ics",
  },
}

/** "2026-07-15T00:00:00Z" -> "20260715" (the ISO's UTC calendar date). */
function icsDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "")
}

/** The day AFTER the ISO's UTC date, for the all-day DTEND (exclusive per RFC 5545). */
function icsDateNext(iso: string): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10).replace(/-/g, "")
}

/** Epoch ms -> "20260613T101530Z" (DTSTAMP shape). */
function icsStamp(ms: number): string {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")
}

/**
 * Build the one-event ICS for a milestone. `nowMs` is injected (not read from the
 * clock) so the output is pure and testable; callers pass Date.now().
 */
export function buildMilestoneIcs(
  milestone: SaleMilestone,
  nowMs: number,
): { filename: string; ics: string } {
  const event = EVENTS[milestone]
  // CRLF line endings per RFC 5545; every line stays under the 75-octet fold limit.
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//gno.land//GNOT Public Sale//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:gnot-${milestone}@sale.gno.land`,
    `DTSTAMP:${icsStamp(nowMs)}`,
    `DTSTART;VALUE=DATE:${icsDate(event.iso)}`,
    `DTEND;VALUE=DATE:${icsDateNext(event.iso)}`,
    `SUMMARY:${event.summary}`,
    "URL:https://sale.gno.land",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n")
  return { filename: event.filename, ics }
}
