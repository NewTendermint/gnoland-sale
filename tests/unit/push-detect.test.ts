import { describe, expect, it } from "vitest"
import { detectTransitions } from "../../lib/push/detect"

const sub = (endpoint: string, bidLimitUsd: number, lastStatus: "winning" | "outbid") => ({
  endpoint,
  bidLimitUsd,
  lastStatus,
})

describe("detectTransitions", () => {
  it("notifies a winning bid that just fell below the clearing", () => {
    const out = detectTransitions([sub("a", 0.1, "winning")], 0.12)
    expect(out.toNotify).toEqual(["a"])
    expect(out.statusUpdates).toEqual([{ endpoint: "a", status: "outbid" }])
  })

  it("does not re-notify an already-outbid bid", () => {
    const out = detectTransitions([sub("a", 0.1, "outbid")], 0.12)
    expect(out.toNotify).toEqual([])
    expect(out.statusUpdates).toEqual([]) // status unchanged
  })

  it("leaves a still-winning bid untouched", () => {
    const out = detectTransitions([sub("a", 0.15, "winning")], 0.12)
    expect(out.toNotify).toEqual([])
    expect(out.statusUpdates).toEqual([])
  })

  it("resets to winning (no notify) when a raise lifts the limit back above clearing", () => {
    const out = detectTransitions([sub("a", 0.2, "outbid")], 0.12)
    expect(out.toNotify).toEqual([])
    expect(out.statusUpdates).toEqual([{ endpoint: "a", status: "winning" }])
  })

  it("treats a bid exactly at the clearing as winning (>=)", () => {
    const out = detectTransitions([sub("a", 0.12, "winning")], 0.12)
    expect(out.toNotify).toEqual([])
    expect(out.statusUpdates).toEqual([])
  })
})
