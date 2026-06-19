import { describe, expect, it } from "vitest"
import { buildMilestoneIcs } from "../../../lib/sale/calendar"

// Pins the exact ICS shape: all-day events (the opening TIME is TBD, param #14),
// exclusive DTEND, CRLF endings, stable UIDs.
describe("buildMilestoneIcs", () => {
  const stampMs = Date.UTC(2026, 5, 13, 10, 15, 30) // 2026-06-13T10:15:30Z

  it("builds the registration-opening all-day event", () => {
    const { filename, ics } = buildMilestoneIcs("registration", stampMs)
    expect(filename).toBe("gnot-registration-opens.ics")
    expect(ics).toContain("DTSTART;VALUE=DATE:20260706")
    expect(ics).toContain("DTEND;VALUE=DATE:20260707")
    expect(ics).toContain("SUMMARY:GNOT sale registration opens")
    expect(ics).toContain("UID:gnot-registration@sale.gno.land")
  })

  it("builds the sale-opening all-day event", () => {
    const { filename, ics } = buildMilestoneIcs("sale", stampMs)
    expect(filename).toBe("gnot-sale-opens.ics")
    expect(ics).toContain("DTSTART;VALUE=DATE:20260720")
    expect(ics).toContain("DTEND;VALUE=DATE:20260721")
    expect(ics).toContain("SUMMARY:GNOT public sale opens")
  })

  it("stamps DTSTAMP from the injected clock", () => {
    const { ics } = buildMilestoneIcs("sale", stampMs)
    expect(ics).toContain("DTSTAMP:20260613T101530Z")
  })

  it("emits a valid envelope with CRLF endings", () => {
    const { ics } = buildMilestoneIcs("registration", stampMs)
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true)
    expect(ics).toContain("\r\nEND:VCALENDAR\r\n")
    // No bare \n anywhere: every line break is CRLF.
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n")
  })
})
