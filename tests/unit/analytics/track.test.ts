import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { attributionSourceFor, bidAmountBucket } from "../../../lib/analytics/track"

type SaEventStub = { (...args: unknown[]): void; q?: unknown[][] }
const win = window as Window & { sa_event?: SaEventStub }

// The gate requires a production build on mainnet; SALE_CHAIN binds at module scope (fail-safe
// sepolia default), so each case re-imports track with the mainnet env stubbed.
let track: typeof import("../../../lib/analytics/track").track

describe("track", () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "mainnet")
    ;({ track } = await import("../../../lib/analytics/track"))
    win.sa_event = undefined
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    win.sa_event = undefined
    // Attribution cookie is read from document.cookie; clear it so it can't leak between tests.
    document.cookie = "gnot_attr=; max-age=0; path=/"
  })

  it("queues events on window.sa_event.q before the script loads", () => {
    track("bid_started", { token: "USDC" })
    expect(win.sa_event).toBeTypeOf("function")
    expect(win.sa_event?.q).toEqual([["bid_started", { token: "USDC" }]])
  })

  it("forwards to sa_event once the script is loaded", () => {
    const loaded = vi.fn()
    win.sa_event = loaded
    track("wallet_connected", { connector: "injected" })
    expect(loaded).toHaveBeenCalledWith("wallet_connected", { connector: "injected" })
  })

  it("sends the bare event name when no metadata is given", () => {
    const loaded = vi.fn()
    win.sa_event = loaded
    track("sonar_auth_started")
    expect(loaded).toHaveBeenCalledWith("sonar_auth_started")
  })

  it("forwards the funnel-coverage events", () => {
    const loaded = vi.fn()
    win.sa_event = loaded
    track("wallet_disconnected")
    track("bid_precheck_blocked", { reason: "wallet-risk" })
    track("sonar_auth_failed", { stage: "init" })
    expect(loaded).toHaveBeenNthCalledWith(1, "wallet_disconnected")
    expect(loaded).toHaveBeenNthCalledWith(2, "bid_precheck_blocked", { reason: "wallet-risk" })
    expect(loaded).toHaveBeenNthCalledWith(3, "sonar_auth_failed", { stage: "init" })
  })

  it("tags bid-funnel events with the influencer source from the attribution cookie", () => {
    document.cookie = "gnot_attr=airdropcosm; path=/"
    const loaded = vi.fn()
    win.sa_event = loaded
    track("bid_confirmed", { token: "USDC" })
    expect(loaded).toHaveBeenCalledWith("bid_confirmed", { token: "USDC", source: "airdropcosm" })
  })

  it("does not tag non-funnel events, nor when the cookie is absent", () => {
    const loaded = vi.fn()
    win.sa_event = loaded
    document.cookie = "gnot_attr=airdropcosm; path=/"
    track("faq_opened") // not a funnel event
    document.cookie = "gnot_attr=; max-age=0; path=/"
    track("bid_confirmed", { token: "USDC" }) // funnel event, but no cookie
    expect(loaded).toHaveBeenNthCalledWith(1, "faq_opened")
    expect(loaded).toHaveBeenNthCalledWith(2, "bid_confirmed", { token: "USDC" })
  })

  it("no-ops outside production builds", () => {
    vi.stubEnv("NODE_ENV", "test")
    const loaded = vi.fn()
    win.sa_event = loaded
    track("bid_started")
    expect(loaded).not.toHaveBeenCalled()
  })

  it("no-ops when the sale chain is not mainnet", async () => {
    vi.resetModules()
    vi.stubEnv("NEXT_PUBLIC_SALE_CHAIN", "sepolia")
    const { track: sepoliaTrack } = await import("../../../lib/analytics/track")
    const loaded = vi.fn()
    win.sa_event = loaded
    sepoliaTrack("bid_started")
    expect(loaded).not.toHaveBeenCalled()
  })

  describe("PII firewall", () => {
    it.each([
      ["wallet address", "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"],
      ["tx hash", "0x98dca4a1cfe0787f2b47f7ce6f21e4bce7cf5e5f3a55f4b1e9e2f0a1b2c3d4e5"],
      ["email", "alice@example.com"],
      ["uuid", "4fc4fd78-e2aa-4b3d-9c1e-0a1b2c3d4e5f"],
    ])("drops a metadata value that looks like a %s", (_kind, value) => {
      const loaded = vi.fn()
      win.sa_event = loaded
      track("bid_confirmed", { leak: value, token: "USDT" })
      expect(loaded).toHaveBeenCalledWith("bid_confirmed", { token: "USDT" })
    })

    it("keeps clean string, number, boolean and short-hex values", () => {
      const loaded = vi.fn()
      win.sa_event = loaded
      track("bid_confirmed", { token: "USDC", amount_bucket: "1k_10k", raise: true, step: 2 })
      expect(loaded).toHaveBeenCalledWith("bid_confirmed", {
        token: "USDC",
        amount_bucket: "1k_10k",
        raise: true,
        step: 2,
      })
    })
  })
})

describe("attributionSourceFor", () => {
  it("returns the validated handle for a bid-funnel event", () => {
    expect(attributionSourceFor("bid_started", "airdropcosm")).toBe("airdropcosm")
    expect(attributionSourceFor("bid_submitted", "airdropcosm")).toBe("airdropcosm")
    expect(attributionSourceFor("bid_confirmed", "airdropcosm")).toBe("airdropcosm")
  })

  it("returns null for non-funnel events even with a valid cookie", () => {
    expect(attributionSourceFor("faq_opened", "airdropcosm")).toBeNull()
    expect(attributionSourceFor("wallet_connected", "airdropcosm")).toBeNull()
  })

  it("returns null for an absent, empty, or unknown-handle cookie", () => {
    expect(attributionSourceFor("bid_confirmed", null)).toBeNull()
    expect(attributionSourceFor("bid_confirmed", "")).toBeNull()
    expect(attributionSourceFor("bid_confirmed", "not-a-promoter")).toBeNull()
  })
})

describe("bidAmountBucket", () => {
  it.each([
    [50, "lt_100"],
    [100, "100_500"],
    [499, "100_500"],
    [500, "500_1k"],
    [999, "500_1k"],
    [1000, "1k_10k"],
    [9999, "1k_10k"],
    [10_000, "10k_plus"],
    [250_000, "10k_plus"],
  ])("buckets $%d as %s", (usd, bucket) => {
    expect(bidAmountBucket(usd)).toBe(bucket)
  })
})
