import { describe, expect, it } from "vitest"
import { errorMessage } from "../../lib/log"

describe("errorMessage", () => {
  it("returns the message, not the error object", () => {
    expect(errorMessage(new Error("upstream exploded"))).toBe("upstream exploded")
  })

  it("stringifies a non-Error throw", () => {
    expect(errorMessage("plain string")).toBe("plain string")
    expect(errorMessage(undefined)).toBe("undefined")
  })

  // viem prints the DECODED call args inside err.message, so a failed contract read would
  // otherwise log the caller's sale-specific entity id. This is the exact shape it produces.
  it("redacts the entity id viem embeds in a contract-call message", () => {
    const viemLike = [
      'The contract function "entityStatesByIDs" returned no data ("0x").',
      "",
      "Contract Call:",
      "  address:   0x959f2ceE7B6C2095d228692eCb2E4744f2D3fDb4",
      "  function:  entityStatesByIDs(bytes16[] entityIDs)",
      '  args:                       (["0xb7f6ed6d2e69bb6c728a7162feef205a"])',
    ].join("\n")
    const out = errorMessage(new Error(viemLike))
    expect(out).not.toContain("b7f6ed6d2e69bb6c728a7162feef205a")
    expect(out).not.toContain("959f2ceE7B6C2095d228692eCb2E4744f2D3fDb4")
    // The actionable part survives: which function failed and why.
    expect(out).toContain("entityStatesByIDs")
    expect(out).toContain("returned no data")
  })

  it("redacts wallet addresses and transaction hashes", () => {
    expect(errorMessage(new Error("from 0x0cfe616673c3920100afcbedaf499af63870b275"))).toBe(
      "from [redacted]",
    )
    expect(
      errorMessage(
        new Error("tx 0x6666625014d1dcd7ba04471a62357520e86ec11e2d17a1507ba334e65bb06033 failed"),
      ),
    ).toBe("tx [redacted] failed")
  })

  it("redacts UUIDs (Sonar echoes them back in error payloads)", () => {
    expect(errorMessage(new Error("sale 1e9a55e0-6542-4d8f-8ed2-1b944ff5fb10 not found"))).toBe(
      "sale [redacted] not found",
    )
  })

  it("keeps short hex readable - a selector or empty revert data identifies nobody", () => {
    expect(errorMessage(new Error('reverted with "0x" and selector 0xd12cf2c5'))).toBe(
      'reverted with "0x" and selector 0xd12cf2c5',
    )
  })

  it("redacts every occurrence, not just the first", () => {
    const two = "a 0x1111111111111111 b 0x2222222222222222"
    expect(errorMessage(new Error(two))).toBe("a [redacted] b [redacted]")
  })
})
