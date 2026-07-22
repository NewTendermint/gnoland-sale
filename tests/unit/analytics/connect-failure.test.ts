import { describe, expect, it } from "vitest"
import { connectFailureBucket } from "../../../lib/analytics/track"

// connectFailureBucket buckets a wallet-connect error by class name and EIP-1193 code only. The
// raw message is never read: it can carry an address, and its wording is unstable across wallets.

describe("connectFailureBucket", () => {
  it.each([
    ["UserRejectedRequestError", "user-rejected"],
    ["ConnectorAlreadyConnectedError", "already-connected"],
    ["ResourceUnavailableRpcError", "resource-unavailable"],
    ["SomethingElseError", "other"],
    ["", "other"],
  ])("buckets a viem error named %s as %s", (name, bucket) => {
    const err = new Error("boom")
    err.name = name
    expect(connectFailureBucket(err)).toBe(bucket)
  })

  it.each([
    [4001, "user-rejected"],
    [-32002, "resource-unavailable"],
    [-32603, "other"],
  ])("buckets an injected provider error with code %s as %s", (code, bucket) => {
    // Injected wallets often throw a raw provider error, not viem's typed class.
    expect(connectFailureBucket({ code })).toBe(bucket)
  })

  it("buckets a value with neither a known name nor code as other", () => {
    expect(connectFailureBucket("nope")).toBe("other")
    expect(connectFailureBucket(undefined)).toBe("other")
    expect(connectFailureBucket(null)).toBe("other")
    expect(connectFailureBucket({ message: "user rejected" })).toBe("other")
  })
})
