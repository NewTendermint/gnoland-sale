import { describe, expect, it } from "vitest"
import { walletConnectedEvent } from "../../../lib/analytics/track"

// walletConnectedEvent decides whether a wagmi onConnect is a real user connection worth tracking.
// A silent auto-reconnect on page load (isReconnected) must not count, or the connect-success
// metric would be inflated by every returning visitor.

describe("walletConnectedEvent", () => {
  it("emits the event with the connector id on a fresh connect", () => {
    expect(
      walletConnectedEvent({ connector: { id: "io.metamask" }, isReconnected: false }),
    ).toEqual({ event: "wallet_connected", metadata: { connector: "io.metamask" } })
  })

  it("returns null on a silent reconnect", () => {
    expect(
      walletConnectedEvent({ connector: { id: "io.metamask" }, isReconnected: true }),
    ).toBeNull()
  })

  it("falls back to a placeholder when the connector id is missing", () => {
    expect(walletConnectedEvent({ connector: {}, isReconnected: false })).toEqual({
      event: "wallet_connected",
      metadata: { connector: "unknown" },
    })
  })
})
