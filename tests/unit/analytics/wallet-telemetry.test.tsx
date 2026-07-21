import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Wiring test for the provider-level wallet telemetry. wagmi's useAccountEffect is mocked to
// capture the handlers so we can invoke them directly (no real WagmiProvider needed), and track
// is mocked because it no-ops under the test env and would otherwise be unobservable.

// vi.hoisted: the spy must exist before the hoisted vi.mock factory runs at import time.
const track = vi.hoisted(() => vi.fn())
vi.mock("@/lib/analytics/track", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/analytics/track")>()),
  track,
}))

let captured: {
  onConnect?: (d: { connector: { id: string }; isReconnected: boolean }) => void
  onDisconnect?: () => void
} = {}
vi.mock("wagmi", () => ({
  useAccountEffect: (handlers: typeof captured) => {
    captured = handlers
  },
}))

import { WalletTelemetry } from "../../../app/[locale]/(layout)/WalletTelemetry"

describe("WalletTelemetry", () => {
  beforeEach(() => {
    captured = {}
    track.mockClear()
    render(<WalletTelemetry />)
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("tracks wallet_connected once on a fresh connect, with the connector id", () => {
    captured.onConnect?.({ connector: { id: "io.metamask" }, isReconnected: false })
    expect(track).toHaveBeenCalledWith("wallet_connected", { connector: "io.metamask" })
  })

  it("does not track a silent reconnect", () => {
    captured.onConnect?.({ connector: { id: "io.metamask" }, isReconnected: true })
    expect(track).not.toHaveBeenCalled()
  })

  it("tracks wallet_disconnected on disconnect", () => {
    captured.onDisconnect?.()
    expect(track).toHaveBeenCalledWith("wallet_disconnected")
  })
})
