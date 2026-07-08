import { describe, expect, it } from "vitest"
import { buildMilestoneIcs } from "../../../lib/sale/calendar"

// Pins the exact ICS shape: timed UTC events (milestones sit at 22:00 UTC; an all-day event
// pinned to the UTC date is the wrong local day east of UTC+2), exclusive DTEND one hour later,
// CRLF endings, stable UIDs.
describe("buildMilestoneIcs", () => {
  const stampMs = Date.UTC(2026, 5, 13, 10, 15, 30) // 2026-06-13T10:15:30Z

  it("builds the registration-opening timed event", () => {
    const { filename, ics } = buildMilestoneIcs("registration", stampMs)
    expect(filename).toBe("gnot-registration-opens.ics")
    expect(ics).toContain("DTSTART:20260709T120000Z")
    expect(ics).toContain("DTEND:20260709T130000Z")
    expect(ics).toContain("SUMMARY:GNOT sale registration opens")
    expect(ics).toContain("UID:gnot-registration@sale.gno.land")
  })

  it("builds the sale-opening timed event", () => {
    const { filename, ics } = buildMilestoneIcs("sale", stampMs)
    expect(filename).toBe("gnot-sale-opens.ics")
    expect(ics).toContain("DTSTART:20260720T120000Z")
    expect(ics).toContain("DTEND:20260720T130000Z")
    expect(ics).toContain("SUMMARY:GNOT public sale opens")
  })

  it("never emits the all-day form (wrong local day for most of the audience)", () => {
    const { ics } = buildMilestoneIcs("sale", stampMs)
    expect(ics).not.toContain("VALUE=DATE")
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
