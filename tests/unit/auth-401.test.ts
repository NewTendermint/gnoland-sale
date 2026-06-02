import { SonarAuthError, withSonarAuth } from "@/lib/sonar/permit"
import { deleteTokens } from "@/lib/sonar/tokens"
import { APIError } from "@echoxyz/sonar-core"
import { afterEach, describe, expect, it, vi } from "vitest"

// Mock the token store so the guard's "clear on 401" can be asserted without a DB.
vi.mock("@/lib/sonar/tokens", () => ({
  deleteTokens: vi.fn(),
  loadTokens: vi.fn(),
  storeTokens: vi.fn(),
}))

const mockedDeleteTokens = vi.mocked(deleteTokens)

afterEach(() => {
  vi.clearAllMocks()
})

describe("withSonarAuth (Sonar 401 -> re-auth guard)", () => {
  it("on a Sonar 401, clears the session's tokens and throws SonarAuthError", async () => {
    await expect(
      withSonarAuth("sess-1", async () => {
        throw new APIError(401, "unauthorized")
      }),
    ).rejects.toBeInstanceOf(SonarAuthError)
    expect(mockedDeleteTokens).toHaveBeenCalledWith("sess-1")
  })

  it("passes a non-401 APIError straight through (no token wipe)", async () => {
    const boom = new APIError(502, "bad gateway")
    await expect(
      withSonarAuth("sess-1", async () => {
        throw boom
      }),
    ).rejects.toBe(boom)
    expect(mockedDeleteTokens).not.toHaveBeenCalled()
  })

  it("returns the value on success", async () => {
    expect(await withSonarAuth("sess-1", async () => 42)).toBe(42)
    expect(mockedDeleteTokens).not.toHaveBeenCalled()
  })
})
