import { timingSafeEqualStr } from "@/lib/security/secret-compare"
import { describe, expect, it } from "vitest"

describe("timingSafeEqualStr", () => {
  it("returns true for identical strings", () => {
    expect(timingSafeEqualStr("s3cret-cron-token", "s3cret-cron-token")).toBe(true)
  })

  it("returns false for different strings of equal length", () => {
    expect(timingSafeEqualStr("aaaaaaaa", "aaaaaaab")).toBe(false)
  })

  it("returns false (no throw) for different lengths - the hash-first property", () => {
    expect(timingSafeEqualStr("short", "a-considerably-longer-secret")).toBe(false)
  })

  it("fails closed on any missing input", () => {
    expect(timingSafeEqualStr(null, "x")).toBe(false)
    expect(timingSafeEqualStr("x", null)).toBe(false)
    expect(timingSafeEqualStr(undefined, "x")).toBe(false)
    expect(timingSafeEqualStr("x", undefined)).toBe(false)
    expect(timingSafeEqualStr("", "x")).toBe(false)
    expect(timingSafeEqualStr("x", "")).toBe(false)
    expect(timingSafeEqualStr(null, null)).toBe(false)
    expect(timingSafeEqualStr(undefined, undefined)).toBe(false)
  })

  it("matches the Bearer-header shape used by the cron routes", () => {
    const secret = "abc123"
    expect(timingSafeEqualStr(`Bearer ${secret}`, `Bearer ${secret}`)).toBe(true)
    expect(timingSafeEqualStr(`Bearer ${secret}`, "Bearer wrong")).toBe(false)
  })
})
