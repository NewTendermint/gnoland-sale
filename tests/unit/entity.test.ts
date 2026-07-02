import { APIError } from "@echoxyz/sonar-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the I/O deps so getEntity's normalization + 401 re-auth wrapping can be
// exercised without a DB or a real Sonar call. The token store's deleteTokens is
// spied so the "clear dead token on 401" behaviour is assertable.
const {
  loadTokensMock,
  deleteTokensMock,
  createSonarClientMock,
  listAvailableEntitiesMock,
  refreshTokenMock,
} = vi.hoisted(() => ({
  loadTokensMock: vi.fn(),
  deleteTokensMock: vi.fn(),
  createSonarClientMock: vi.fn(),
  listAvailableEntitiesMock: vi.fn(),
  refreshTokenMock: vi.fn(),
}))

vi.mock("../../lib/sonar/tokens", () => ({
  loadTokens: loadTokensMock,
  storeTokens: vi.fn(),
  deleteTokens: deleteTokensMock,
}))
vi.mock("../../lib/sonar/client", () => ({
  createSonarClient: createSonarClientMock,
}))

import { getEntity } from "../../lib/sonar/entity"
import { SonarAuthError } from "../../lib/sonar/permit"

describe("getEntity", () => {
  beforeEach(() => {
    loadTokensMock.mockReset()
    deleteTokensMock.mockReset()
    createSonarClientMock.mockReset()
    listAvailableEntitiesMock.mockReset()
    refreshTokenMock.mockReset()
    createSonarClientMock.mockReturnValue({
      listAvailableEntities: listAvailableEntitiesMock,
      refreshToken: refreshTokenMock,
    })
    // A valid, non-expiring token so ensureFreshTokens returns it without a refresh.
    loadTokensMock.mockResolvedValue({
      accessToken: "tok",
      refreshToken: "r",
      expiresAt: new Date(Date.now() + 60 * 60_000),
    })
  })

  it("normalizes the session's first entity (id + setup + eligibility + region)", async () => {
    listAvailableEntitiesMock.mockResolvedValue({
      Entities: [
        {
          EntityID: "11111111-1111-1111-1111-111111111111",
          EntitySetupState: "complete",
          SaleEligibility: "eligible",
          InvestingRegion: "us",
        },
      ],
    })
    expect(await getEntity("sess-ok")).toEqual({
      entityId: "11111111-1111-1111-1111-111111111111",
      setupState: "complete",
      eligibility: "eligible",
      investingRegion: "us",
    })
  })

  it("returns null when the session has no entity yet", async () => {
    listAvailableEntitiesMock.mockResolvedValue({ Entities: [] })
    expect(await getEntity("sess-empty")).toBeNull()
  })

  it("defaults an unrecognized setup/eligibility safely rather than casting blindly", async () => {
    listAvailableEntitiesMock.mockResolvedValue({
      Entities: [
        {
          EntityID: "22222222-2222-2222-2222-222222222222",
          EntitySetupState: "brand-new-state",
          SaleEligibility: "brand-new-eligibility",
          InvestingRegion: "brand-new-region",
        },
      ],
    })
    expect(await getEntity("sess-unknown")).toEqual({
      entityId: "22222222-2222-2222-2222-222222222222",
      setupState: "not-started",
      eligibility: "unknown-setup-incomplete",
      investingRegion: "unknown",
    })
  })

  it("recovers from a stale-token 401: refreshes and retries, the session survives", async () => {
    listAvailableEntitiesMock
      .mockRejectedValueOnce(new APIError(401, "unauthorized"))
      .mockResolvedValueOnce({
        Entities: [
          {
            EntityID: "11111111-1111-1111-1111-111111111111",
            EntitySetupState: "complete",
            SaleEligibility: "eligible",
            InvestingRegion: "eu",
          },
        ],
      })
    refreshTokenMock.mockResolvedValue({
      access_token: "tok-2",
      refresh_token: "refresh-2",
      token_type: "bearer",
      expires_in: 3600,
    })
    expect(await getEntity("sess-refresh")).toMatchObject({ setupState: "complete" })
    expect(deleteTokensMock).not.toHaveBeenCalled()
  })

  it("on a 401 with a dead refresh token, clears the session and throws SonarAuthError", async () => {
    listAvailableEntitiesMock.mockRejectedValue(new APIError(401, "unauthorized"))
    refreshTokenMock.mockRejectedValue(new APIError(400, "invalid_grant"))
    await expect(getEntity("sess-401")).rejects.toBeInstanceOf(SonarAuthError)
    expect(deleteTokensMock).toHaveBeenCalledWith("sess-401")
  })
})
