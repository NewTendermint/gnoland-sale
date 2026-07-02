import { APIError } from "@echoxyz/sonar-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the token store + Sonar client so the 401 -> refresh -> retry guard can be
// exercised without a DB or network.
const {
  loadTokensMock,
  storeTokensMock,
  deleteTokensMock,
  refreshTokenMock,
  createSonarClientMock,
} = vi.hoisted(() => ({
  loadTokensMock: vi.fn(),
  storeTokensMock: vi.fn(),
  deleteTokensMock: vi.fn(),
  refreshTokenMock: vi.fn(),
  createSonarClientMock: vi.fn(),
}))

vi.mock("@/lib/sonar/tokens", () => ({
  loadTokens: loadTokensMock,
  storeTokens: storeTokensMock,
  deleteTokens: deleteTokensMock,
}))
vi.mock("@/lib/sonar/client", () => ({ createSonarClient: createSonarClientMock }))

import { SonarAuthError, withSonarAuth } from "@/lib/sonar/permit"

// Comfortably-valid stored pair: the proactive needsRefresh path stays quiet, so any
// refresh observed below comes from the 401 recovery path.
const STORED = {
  accessToken: "tok-1",
  refreshToken: "refresh-1",
  expiresAt: new Date(Date.now() + 60 * 60_000),
}
const ROTATED = {
  access_token: "tok-2",
  refresh_token: "refresh-2",
  token_type: "bearer",
  expires_in: 3600,
}

beforeEach(() => {
  vi.clearAllMocks()
  loadTokensMock.mockResolvedValue({ ...STORED })
  refreshTokenMock.mockResolvedValue({ ...ROTATED })
  createSonarClientMock.mockReturnValue({ refreshToken: refreshTokenMock })
})

describe("withSonarAuth (401 -> refresh once -> retry once)", () => {
  it("passes the access token to the call and returns its value", async () => {
    expect(await withSonarAuth("sess-1", async (token) => token)).toBe("tok-1")
    expect(refreshTokenMock).not.toHaveBeenCalled()
    expect(deleteTokensMock).not.toHaveBeenCalled()
  })

  it("on a 401, refreshes and retries once with the new token - the session survives", async () => {
    const fn = vi
      .fn<(token: string) => Promise<string>>()
      .mockRejectedValueOnce(new APIError(401, "unauthorized"))
      .mockImplementation(async (token) => token)

    expect(await withSonarAuth("sess-1", fn)).toBe("tok-2")
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenLastCalledWith("tok-2")
    expect(refreshTokenMock).toHaveBeenCalledTimes(1)
    expect(storeTokensMock).toHaveBeenCalledTimes(1)
    expect(deleteTokensMock).not.toHaveBeenCalled()
  })

  it("ends the session only when the refresh itself is rejected (invalid_grant)", async () => {
    refreshTokenMock.mockRejectedValue(new APIError(400, "invalid_grant"))
    await expect(
      withSonarAuth("sess-1", async () => {
        throw new APIError(401, "unauthorized")
      }),
    ).rejects.toBeInstanceOf(SonarAuthError)
    expect(deleteTokensMock).toHaveBeenCalledWith("sess-1")
  })

  it("ends the session when the retried call still 401s", async () => {
    await expect(
      withSonarAuth("sess-1", async () => {
        throw new APIError(401, "unauthorized")
      }),
    ).rejects.toBeInstanceOf(SonarAuthError)
    expect(refreshTokenMock).toHaveBeenCalledTimes(1)
    expect(deleteTokensMock).toHaveBeenCalledWith("sess-1")
  })

  it("keeps the session on a transient refresh failure (5xx propagates, no token wipe)", async () => {
    const outage = new APIError(503, "unavailable")
    refreshTokenMock.mockRejectedValue(outage)
    await expect(
      withSonarAuth("sess-1", async () => {
        throw new APIError(401, "unauthorized")
      }),
    ).rejects.toBe(outage)
    expect(deleteTokensMock).not.toHaveBeenCalled()
  })

  it("passes a non-401 APIError straight through (no refresh, no token wipe)", async () => {
    const boom = new APIError(502, "bad gateway")
    await expect(
      withSonarAuth("sess-1", async () => {
        throw boom
      }),
    ).rejects.toBe(boom)
    expect(refreshTokenMock).not.toHaveBeenCalled()
    expect(deleteTokensMock).not.toHaveBeenCalled()
  })

  it("treats a session without stored tokens as unauthenticated (SonarAuthError, call never runs)", async () => {
    loadTokensMock.mockResolvedValue(null)
    const fn = vi.fn()
    await expect(withSonarAuth("sess-1", fn)).rejects.toBeInstanceOf(SonarAuthError)
    expect(fn).not.toHaveBeenCalled()
  })

  it("coalesces the 401-triggered refresh across concurrent calls (one rotation, both retried)", async () => {
    const fnA = vi
      .fn<(token: string) => Promise<string>>()
      .mockRejectedValueOnce(new APIError(401, "unauthorized"))
      .mockImplementation(async (token) => `A:${token}`)
    const fnB = vi
      .fn<(token: string) => Promise<string>>()
      .mockRejectedValueOnce(new APIError(401, "unauthorized"))
      .mockImplementation(async (token) => `B:${token}`)

    const [a, b] = await Promise.all([
      withSonarAuth("sess-shared", fnA),
      withSonarAuth("sess-shared", fnB),
    ])

    expect(a).toBe("A:tok-2")
    expect(b).toBe("B:tok-2")
    expect(refreshTokenMock).toHaveBeenCalledTimes(1)
    expect(deleteTokensMock).not.toHaveBeenCalled()
  })
})
