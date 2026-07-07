import { describe, expect, it } from "vitest"
import { CLOSING_SOON_WINDOW_MS, resolveTabAlertState } from "../../lib/sale/tab-alert"

const NOW = 1_000_000_000_000

describe("CLOSING_SOON_WINDOW_MS", () => {
  it("is two hours", () => {
    expect(CLOSING_SOON_WINDOW_MS).toBe(2 * 60 * 60 * 1000)
  })
})

describe("resolveTabAlertState", () => {
  it("returns 'outbid' while live, regardless of time left", () => {
    expect(
      resolveTabAlertState({
        journey: "has-bid-outbid",
        phase: "live",
        saleClosesMs: NOW + 10 * CLOSING_SOON_WINDOW_MS,
        nowMs: NOW,
      }),
    ).toBe("outbid")
  })

  it("does not fire 'outbid' outside the live phase (nothing to raise after close)", () => {
    for (const phase of ["pre-sale", "ended"] as const) {
      expect(
        resolveTabAlertState({
          journey: "has-bid-outbid",
          phase,
          saleClosesMs: NOW - 1,
          nowMs: NOW,
        }),
      ).toBeNull()
    }
  })

  it("never fires 'outbid' for a pending (confirmed-but-unreported) bid", () => {
    // The pending overlay can sit below the current clearing; alarming the user's own fresh bid
    // as outbid would be a false claim - has-bid-pending stays silent.
    expect(
      resolveTabAlertState({
        journey: "has-bid-pending",
        phase: "live",
        saleClosesMs: NOW + 10 * CLOSING_SOON_WINDOW_MS,
        nowMs: NOW,
      }),
    ).toBeNull()
  })

  it("prioritizes 'outbid' over 'closing-soon' when both hold", () => {
    expect(
      resolveTabAlertState({
        journey: "has-bid-outbid",
        phase: "live",
        saleClosesMs: NOW + 60_000, // also inside the closing window
        nowMs: NOW,
      }),
    ).toBe("outbid")
  })

  it("returns 'closing-soon' when live and within the window", () => {
    expect(
      resolveTabAlertState({
        journey: "has-bid-winning",
        phase: "live",
        saleClosesMs: NOW + CLOSING_SOON_WINDOW_MS / 2,
        nowMs: NOW,
      }),
    ).toBe("closing-soon")
  })

  it("includes the exact window boundary", () => {
    expect(
      resolveTabAlertState({
        journey: "ready",
        phase: "live",
        saleClosesMs: NOW + CLOSING_SOON_WINDOW_MS,
        nowMs: NOW,
      }),
    ).toBe("closing-soon")
  })

  it("returns null just outside the window", () => {
    expect(
      resolveTabAlertState({
        journey: "ready",
        phase: "live",
        saleClosesMs: NOW + CLOSING_SOON_WINDOW_MS + 1,
        nowMs: NOW,
      }),
    ).toBeNull()
  })

  it("returns null once the sale has closed (no negative-time alert)", () => {
    expect(
      resolveTabAlertState({
        journey: "ready",
        phase: "live",
        saleClosesMs: NOW,
        nowMs: NOW,
      }),
    ).toBeNull()
    expect(
      resolveTabAlertState({
        journey: "ready",
        phase: "live",
        saleClosesMs: NOW - 1,
        nowMs: NOW,
      }),
    ).toBeNull()
  })

  it("does not show 'closing-soon' outside the live phase", () => {
    for (const phase of ["pre-sale", "ended"] as const) {
      expect(
        resolveTabAlertState({
          journey: "ready",
          phase,
          saleClosesMs: NOW + 60_000,
          nowMs: NOW,
        }),
      ).toBeNull()
    }
  })

  it("returns null for an engaged bidder who is winning and far from close", () => {
    expect(
      resolveTabAlertState({
        journey: "has-bid-winning",
        phase: "live",
        saleClosesMs: NOW + 10 * CLOSING_SOON_WINDOW_MS,
        nowMs: NOW,
      }),
    ).toBeNull()
  })
})
