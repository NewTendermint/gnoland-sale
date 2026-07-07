import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the I/O dependencies so we can exercise refresh-coalescing, dedup, the
// pre-purchase mapper, and the audit-wiring in isolation.
const {
  loadTokensMock,
  storeTokensMock,
  refreshTokenMock,
  generatePurchasePermitMock,
  createSonarClientMock,
  insertValuesMock,
} = vi.hoisted(() => ({
  loadTokensMock: vi.fn(),
  storeTokensMock: vi.fn(),
  refreshTokenMock: vi.fn(),
  generatePurchasePermitMock: vi.fn(),
  createSonarClientMock: vi.fn(),
  insertValuesMock: vi.fn(),
}))

vi.mock("../../lib/sonar/tokens", () => ({
  loadTokens: loadTokensMock,
  storeTokens: storeTokensMock,
  deleteTokens: vi.fn(),
}))
vi.mock("../../lib/sonar/client", () => ({
  createSonarClient: createSonarClientMock,
}))
vi.mock("../../lib/db/client", () => ({
  db: { insert: () => ({ values: insertValuesMock }) },
}))

import { auditMetadataSchema } from "../../lib/db/schema"
import {
  checkPermitDedup,
  ensureFreshTokens,
  generatePurchasePermit,
  mapPrePurchase,
  needsRefresh,
} from "../../lib/sonar/permit"

describe("needsRefresh", () => {
  const now = 1_000_000_000_000
  it("is true within the 5-minute skew window", () => {
    expect(needsRefresh(new Date(now + 60_000), now)).toBe(true)
  })
  it("is false when the token is comfortably valid", () => {
    expect(needsRefresh(new Date(now + 60 * 60_000), now)).toBe(false)
  })
})

describe("checkPermitDedup", () => {
  it("allows the first request, blocks a repeat inside 5s, allows after", () => {
    const wallet = "0xfirstwallet"
    expect(() => checkPermitDedup(wallet, 1000)).not.toThrow()
    expect(() => checkPermitDedup(wallet, 3000)).toThrow(/recently issued/i)
    expect(() => checkPermitDedup(wallet, 6000)).not.toThrow()
  })
})

describe("ensureFreshTokens refresh coalescing", () => {
  beforeEach(() => {
    loadTokensMock.mockReset()
    storeTokensMock.mockReset()
    refreshTokenMock.mockReset()
    createSonarClientMock.mockReset()
    createSonarClientMock.mockReturnValue({
      refreshToken: refreshTokenMock,
      generatePurchasePermit: generatePurchasePermitMock,
    })
  })

  it("refreshes exactly once for concurrent calls on the same session", async () => {
    loadTokensMock.mockResolvedValue({
      accessToken: "old",
      refreshToken: "old-refresh",
      expiresAt: new Date(Date.now() + 60_000), // within skew -> needs refresh
    })
    refreshTokenMock.mockResolvedValue({
      access_token: "new",
      refresh_token: "new-refresh",
      token_type: "bearer",
      expires_in: 3600,
    })

    const [a, b] = await Promise.all([
      ensureFreshTokens("session-x"),
      ensureFreshTokens("session-x"),
    ])

    expect(refreshTokenMock).toHaveBeenCalledTimes(1)
    expect(storeTokensMock).toHaveBeenCalledTimes(1)
    expect(a.accessToken).toBe("new")
    expect(b.accessToken).toBe("new")
  })

  it("does not refresh a token that is still comfortably valid", async () => {
    loadTokensMock.mockResolvedValue({
      accessToken: "still-good",
      refreshToken: "r",
      expiresAt: new Date(Date.now() + 60 * 60_000),
    })
    const result = await ensureFreshTokens("session-y")
    expect(refreshTokenMock).not.toHaveBeenCalled()
    expect(result.accessToken).toBe("still-good")
  })

  it("keeps the existing refresh token when the refresh response omits one", async () => {
    loadTokensMock.mockResolvedValue({
      accessToken: "old",
      refreshToken: "keep-me",
      expiresAt: new Date(Date.now() + 60_000), // within skew -> needs refresh
    })
    // A non-rotating refresh: a fresh access token, but no new refresh token.
    refreshTokenMock.mockResolvedValue({
      access_token: "new",
      token_type: "bearer",
      expires_in: 3600,
    })

    const result = await ensureFreshTokens("session-z")

    expect(result.accessToken).toBe("new")
    expect(result.refreshToken).toBe("keep-me")
    expect(storeTokensMock).toHaveBeenCalledTimes(1)
    expect(storeTokensMock.mock.calls[0][1].refreshToken).toBe("keep-me")
  })
})

describe("auditMetadataSchema (PII allow-list)", () => {
  it("accepts the whitelisted keys", () => {
    expect(() =>
      auditMetadataSchema.parse({ permit_id_prefix: "0x123456", chain_id: 8453 }),
    ).not.toThrow()
  })
  it("rejects any non-whitelisted key (e.g. PII)", () => {
    expect(() => auditMetadataSchema.parse({ email: "a@b.com" })).toThrow()
  })
  it("rejects an over-long permit_id_prefix", () => {
    expect(() => auditMetadataSchema.parse({ permit_id_prefix: "x".repeat(20) })).toThrow()
  })
})

describe("mapPrePurchase", () => {
  it("maps a ready response to the normalized ready result", () => {
    expect(
      mapPrePurchase({ ReadyToPurchase: true, FailureReason: "", LivenessCheckURL: "" }),
    ).toEqual({ readyToPurchase: true })
  })
  it("maps a not-ready response, normalizing the failure reason and liveness URL", () => {
    expect(
      mapPrePurchase({
        ReadyToPurchase: false,
        FailureReason: "requires-liveness",
        LivenessCheckURL: "https://kyc.example/live",
      }),
    ).toEqual({
      readyToPurchase: false,
      failureReason: "requires-liveness",
      livenessCheckUrl: "https://kyc.example/live",
    })
  })
  it("falls back to 'unknown' for an unrecognized failure reason", () => {
    expect(
      mapPrePurchase({
        ReadyToPurchase: false,
        FailureReason: "brand-new-reason",
        LivenessCheckURL: "",
      }),
    ).toMatchObject({ readyToPurchase: false, failureReason: "unknown" })
  })
})

describe("generatePurchasePermit audit wiring", () => {
  beforeEach(() => {
    loadTokensMock.mockReset()
    storeTokensMock.mockReset()
    generatePurchasePermitMock.mockReset()
    insertValuesMock.mockReset()
    createSonarClientMock.mockReset()
    createSonarClientMock.mockReturnValue({
      refreshToken: refreshTokenMock,
      generatePurchasePermit: generatePurchasePermitMock,
    })
    loadTokensMock.mockResolvedValue({
      accessToken: "tok",
      refreshToken: "r",
      expiresAt: new Date(Date.now() + 60 * 60_000), // valid -> no refresh
    })
  })

  it("writes the two-step audit trail (requested then issued) with only allow-listed metadata", async () => {
    generatePurchasePermitMock.mockResolvedValue({
      PermitJSON: {},
      Signature: "0xabcdef1234567890",
    })

    await generatePurchasePermit({
      sessionId: "s-audit",
      entityId: "11111111-1111-1111-1111-111111111111",
      wallet: "0xWALLETaudit",
      ipHmac: "deadbeef",
      userAgentClass: "chrome-desktop",
    })

    // Two rows: permit_requested BEFORE the Sonar call, permit_issued after.
    expect(insertValuesMock).toHaveBeenCalledTimes(2)
    const requested = insertValuesMock.mock.calls[0][0]
    expect(requested.event).toBe("permit_requested")
    expect(requested.wallet).toBe("0xWALLETaudit")
    expect(Object.keys(requested.metadata)).toEqual(["chain_id"])
    const issued = insertValuesMock.mock.calls[1][0]
    expect(issued.event).toBe("permit_issued")
    expect(issued.wallet).toBe("0xWALLETaudit")
    expect(issued.ipHmac).toBe("deadbeef")
    // metadata is the strict-validated object: only allow-listed keys survive,
    // and it is the signature prefix, never the full signature.
    expect(Object.keys(issued.metadata).sort()).toEqual(["chain_id", "permit_id_prefix"])
    expect(issued.metadata.permit_id_prefix).toBe("0xabcdef12")
  })

  it("is FATAL when the permit_requested row cannot be written: no permit without an audit trail", async () => {
    insertValuesMock.mockRejectedValueOnce(new Error("db down"))
    await expect(
      generatePurchasePermit({
        sessionId: "s-audit",
        entityId: "11111111-1111-1111-1111-111111111111",
        // Distinct wallet: the module-level dedup window (5s per wallet) survives across tests.
        wallet: "0xWALLETaudit-fatal",
      }),
    ).rejects.toThrow("db down")
    // The failure happened BEFORE issuance - Sonar was never asked for a permit.
    expect(generatePurchasePermitMock).not.toHaveBeenCalled()
  })

  it("still returns the live permit when the permit_issued row fails (logged, not fatal)", async () => {
    generatePurchasePermitMock.mockResolvedValue({
      PermitJSON: {},
      Signature: "0xabcdef1234567890",
    })
    // First insert (permit_requested) succeeds, second (permit_issued) fails.
    insertValuesMock.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("db down"))
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const res = await generatePurchasePermit({
      sessionId: "s-audit",
      entityId: "11111111-1111-1111-1111-111111111111",
      // Distinct wallet: the module-level dedup window (5s per wallet) survives across tests.
      wallet: "0xWALLETaudit-nonfatal",
    })

    // The permit is already live and spendable: a 502 here would be a lie.
    expect(res.Signature).toBe("0xabcdef1234567890")
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
