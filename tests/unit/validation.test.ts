import { describe, expect, it } from "vitest"
import { evmAddress } from "../../lib/validation"

const CHECKSUMMED = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"

describe("evmAddress", () => {
  it("accepts a checksummed address and lowercases it", () => {
    expect(evmAddress.parse(CHECKSUMMED)).toBe(CHECKSUMMED.toLowerCase())
  })

  it("normalizes casing so dedup/audit keys cannot split", () => {
    expect(evmAddress.parse(CHECKSUMMED)).toBe(
      evmAddress.parse(CHECKSUMMED.toUpperCase().replace("0X", "0x")),
    )
  })

  it("rejects non-address strings", () => {
    for (const bad of [
      "",
      "0x",
      "0x123",
      `${CHECKSUMMED}ff`,
      CHECKSUMMED.replace("0x", ""),
      "0xZZ86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ]) {
      expect(evmAddress.safeParse(bad).success).toBe(false)
    }
  })
})
