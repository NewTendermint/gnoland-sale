import { GET as callbackGET } from "@/app/api/auth/sonar/callback/route"
import { POST as initPOST } from "@/app/api/auth/sonar/init/route"
import { POST as prePurchasePOST } from "@/app/api/sonar/pre-purchase/route"
import { getSession } from "@/lib/security/session"
import { createSonarClient } from "@/lib/sonar/client"
import { getEntity } from "@/lib/sonar/entity"
import { sonarMockEnabled } from "@/lib/sonar/mock-config"
import { consumePkceState, generatePkceAndStore } from "@/lib/sonar/oauth"
import { prePurchaseCheck } from "@/lib/sonar/permit"
import { storeTokens } from "@/lib/sonar/tokens"
import { afterEach, describe, expect, it, vi } from "vitest"

// Mock the request-scoped + heavy server deps so each test exercises ONLY the route
// handler's own logic (auth gating, the mock-login branch, entity derivation, the
// OAuth state<->session binding).
vi.mock("@/lib/security/session", () => ({ getSession: vi.fn() }))
vi.mock("@/lib/sonar/mock-config", () => ({ sonarMockEnabled: vi.fn() }))
vi.mock("@/lib/sonar/oauth", () => ({
  generatePkceAndStore: vi.fn(),
  consumePkceState: vi.fn(),
}))
vi.mock("@/lib/sonar/entity", () => ({ getEntity: vi.fn() }))
vi.mock("@/lib/sonar/permit", () => ({ prePurchaseCheck: vi.fn() }))
vi.mock("@/lib/sonar/client", () => ({ createSonarClient: vi.fn() }))
vi.mock("@/lib/sonar/tokens", () => ({ storeTokens: vi.fn() }))

const mockedGetSession = vi.mocked(getSession)
const mockedSonarMock = vi.mocked(sonarMockEnabled)
const mockedGenPkce = vi.mocked(generatePkceAndStore)
const mockedConsumePkce = vi.mocked(consumePkceState)
const mockedGetEntity = vi.mocked(getEntity)
const mockedPrePurchase = vi.mocked(prePurchaseCheck)
const mockedCreateSonarClient = vi.mocked(createSonarClient)
const mockedStoreTokens = vi.mocked(storeTokens)

type SessionLike = Awaited<ReturnType<typeof getSession>>
function sessionStub(sessionId?: string): SessionLike {
  return { sessionId, save: async () => {} } as unknown as SessionLike
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("POST /api/auth/sonar/init", () => {
  it("in mock mode, logs the session in and bounces home without touching Sonar OAuth", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedSonarMock.mockReturnValue(true)
    const res = await initPOST()
    expect(await res.json()).toEqual({ authorizationUrl: "/?auth=ok" })
    // The bypass must never mint real PKCE / call Sonar.
    expect(mockedGenPkce).not.toHaveBeenCalled()
  })

  it("in real mode, returns the Sonar authorization URL from PKCE", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedSonarMock.mockReturnValue(false)
    mockedGenPkce.mockResolvedValue("https://sonar.example/oauth/authorize?x=1")
    const res = await initPOST()
    expect(await res.json()).toEqual({
      authorizationUrl: "https://sonar.example/oauth/authorize?x=1",
    })
    expect(mockedGenPkce).toHaveBeenCalledWith("sess-1")
  })
})

describe("POST /api/sonar/pre-purchase", () => {
  function req(body: unknown): Request {
    return new Request("http://test/api/sonar/pre-purchase", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  it("returns 401 when the caller has no session", async () => {
    mockedGetSession.mockResolvedValue(sessionStub(undefined))
    const res = await prePurchasePOST(req({ wallet: `0x${"1".repeat(40)}` }))
    expect(res.status).toBe(401)
    expect(mockedGetEntity).not.toHaveBeenCalled()
  })

  it("ignores a client-supplied entityId and derives the entity from the session (IDOR guard)", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockResolvedValue({
      entityId: "server-entity",
      setupState: "complete",
      eligibility: "eligible",
    })
    mockedPrePurchase.mockResolvedValue({ readyToPurchase: true })
    const wallet = `0x${"a".repeat(40)}`

    const res = await prePurchasePOST(req({ wallet, entityId: "attacker-entity" }))

    expect(res.status).toBe(200)
    expect(mockedGetEntity).toHaveBeenCalledWith("sess-1")
    // The Sonar check runs against the SESSION's entity, never the client's value.
    expect(mockedPrePurchase).toHaveBeenCalledWith({
      sessionId: "sess-1",
      entityId: "server-entity",
      wallet,
    })
  })
})

describe("GET /api/auth/sonar/callback", () => {
  function cbReq(qs: string): Request {
    return new Request(`http://test/api/auth/sonar/callback?${qs}`)
  }

  it("rejects a callback whose state was minted under a different session (CSRF)", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("victim-session"))
    mockedConsumePkce.mockResolvedValue({ sessionId: "attacker-session", codeVerifier: "v" })

    const res = await callbackGET(cbReq("code=abc&state=xyz"))

    expect(res.headers.get("location")).toContain("auth=error")
    // The mismatched state must never reach the token exchange or get persisted.
    expect(mockedCreateSonarClient).not.toHaveBeenCalled()
    expect(mockedStoreTokens).not.toHaveBeenCalled()
  })

  it("on a session-bound callback, exchanges the code and stores the tokens", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("s1"))
    mockedConsumePkce.mockResolvedValue({ sessionId: "s1", codeVerifier: "v" })
    const exchangeAuthorizationCode = vi
      .fn()
      .mockResolvedValue({ access_token: "at", refresh_token: "rt", expires_in: 3600 })
    mockedCreateSonarClient.mockReturnValue({
      exchangeAuthorizationCode,
    } as unknown as ReturnType<typeof createSonarClient>)

    const res = await callbackGET(cbReq("code=abc&state=xyz"))

    expect(res.headers.get("location")).toContain("auth=ok")
    expect(mockedStoreTokens).toHaveBeenCalledWith(
      "s1",
      expect.objectContaining({ accessToken: "at", refreshToken: "rt" }),
    )
  })

  it("redirects to auth=error when code or state is missing", async () => {
    const res = await callbackGET(cbReq("code=abc"))
    expect(res.headers.get("location")).toContain("auth=error")
    expect(mockedConsumePkce).not.toHaveBeenCalled()
  })
})
