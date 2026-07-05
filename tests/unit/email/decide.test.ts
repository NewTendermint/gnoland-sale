import { describe, expect, it } from "vitest"
import { COOLDOWN_MS, decidePriceEmail } from "../../../lib/email/decide"

const NOW = 1_800_000_000_000

describe("decidePriceEmail", () => {
  it("first run records a baseline and never sends", () => {
    expect(
      decidePriceEmail({
        clearingPriceUsd: 0.07,
        lastSentPriceUsd: null,
        lastSentAtMs: null,
        nowMs: NOW,
      }),
    ).toEqual({ action: "skip", reason: "first-run-baseline" })
  })

  it("price equal or lower than the last sent price never sends", () => {
    for (const price of [0.07, 0.06]) {
      expect(
        decidePriceEmail({
          clearingPriceUsd: price,
          lastSentPriceUsd: 0.07,
          lastSentAtMs: NOW - COOLDOWN_MS * 2,
          nowMs: NOW,
        }),
      ).toEqual({ action: "skip", reason: "price-not-higher" })
    }
  })

  it("a rise inside the cooldown window is deferred", () => {
    expect(
      decidePriceEmail({
        clearingPriceUsd: 0.08,
        lastSentPriceUsd: 0.07,
        lastSentAtMs: NOW - COOLDOWN_MS + 1,
        nowMs: NOW,
      }),
    ).toEqual({ action: "skip", reason: "cooldown" })
  })

  it("a rise after the cooldown sends (boundary inclusive)", () => {
    expect(
      decidePriceEmail({
        clearingPriceUsd: 0.08,
        lastSentPriceUsd: 0.07,
        lastSentAtMs: NOW - COOLDOWN_MS,
        nowMs: NOW,
      }),
    ).toEqual({ action: "send" })
  })

  it("a rise with no prior send timestamp sends (baseline row without send)", () => {
    expect(
      decidePriceEmail({
        clearingPriceUsd: 0.08,
        lastSentPriceUsd: 0.07,
        lastSentAtMs: null,
        nowMs: NOW,
      }),
    ).toEqual({ action: "send" })
  })
})
