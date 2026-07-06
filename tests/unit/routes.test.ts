import { GET as callbackGET } from "@/app/api/auth/sonar/callback/route"
import { POST as initPOST } from "@/app/api/auth/sonar/init/route"
import { GET as entityGET } from "@/app/api/sonar/entity/route"
import { POST as generatePermitPOST } from "@/app/api/sonar/generate-permit/route"
import { GET as myPositionGET } from "@/app/api/sonar/my-position/route"
import { POST as prePurchasePOST } from "@/app/api/sonar/pre-purchase/route"
import { env } from "@/lib/env"
import type { EntitySnapshot } from "@/lib/sale/types"
import { getSession } from "@/lib/security/session"
import { createSonarClient } from "@/lib/sonar/client"
import { readMyBid } from "@/lib/sonar/commitments"
import { getEntity } from "@/lib/sonar/entity"
import { sonarMockEnabled } from "@/lib/sonar/mock-config"
import { consumePkceState, generatePkceAndStore } from "@/lib/sonar/oauth"
import {
  PermitDedupError,
  SonarAuthError,
  generatePurchasePermit,
  prePurchaseCheck,
} from "@/lib/sonar/permit"
import { deleteTokens, storeTokens } from "@/lib/sonar/tokens"
import { afterEach, describe, expect, it, vi } from "vitest"

// Mock the request-scoped + heavy server deps so each test exercises ONLY the route
// handler's own logic (auth gating, the mock-login branch, entity derivation, the
// OAuth state<->session binding, and the error-status mapping). env is a mutable
// stub so the SALE_PAUSED kill-switch is testable; the Sonar error classes stay REAL
// (importOriginal) so the routes' instanceof checks resolve.
vi.mock("@/lib/env", () => ({
  env: {
    SALE_PAUSED: "false",
    SALE_CHAIN: "base-sepolia",
    SONAR_REDIRECT_URI: "https://app.example/callback",
    SONAR_SALE_UUID: "test-sale",
    IP_HMAC_PEPPER: "0".repeat(64),
  },
}))
vi.mock("@/lib/security/session", () => ({ getSession: vi.fn() }))
vi.mock("@/lib/sonar/mock-config", () => ({ sonarMockEnabled: vi.fn() }))
vi.mock("@/lib/sonar/oauth", () => ({
  generatePkceAndStore: vi.fn(),
  consumePkceState: vi.fn(),
}))
vi.mock("@/lib/sonar/entity", () => ({ getEntity: vi.fn() }))
vi.mock("@/lib/sonar/commitments", () => ({ readMyBid: vi.fn() }))
vi.mock("@/lib/sonar/permit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/sonar/permit")>()
  return { ...actual, prePurchaseCheck: vi.fn(), generatePurchasePermit: vi.fn() }
})
vi.mock("@/lib/sonar/client", () => ({ createSonarClient: vi.fn() }))
vi.mock("@/lib/sonar/tokens", () => ({ storeTokens: vi.fn(), deleteTokens: vi.fn() }))

const mockedGetSession = vi.mocked(getSession)
const mockedSonarMock = vi.mocked(sonarMockEnabled)
const mockedGenPkce = vi.mocked(generatePkceAndStore)
const mockedConsumePkce = vi.mocked(consumePkceState)
const mockedGetEntity = vi.mocked(getEntity)
const mockedReadMyBid = vi.mocked(readMyBid)
const mockedPrePurchase = vi.mocked(prePurchaseCheck)
const mockedGeneratePermit = vi.mocked(generatePurchasePermit)
const mockedCreateSonarClient = vi.mocked(createSonarClient)
const mockedStoreTokens = vi.mocked(storeTokens)
const mockedDeleteTokens = vi.mocked(deleteTokens)

type SessionLike = Awaited<ReturnType<typeof getSession>>
function sessionStub(sessionId?: string): SessionLike {
  return { sessionId, save: async () => {} } as unknown as SessionLike
}

const wallet = `0x${"a".repeat(40)}`
const entitySnap: EntitySnapshot = {
  entityId: "server-entity",
  setupState: "complete",
  eligibility: "eligible",
  investingRegion: "other",
}

afterEach(() => {
  vi.clearAllMocks()
  ;(env as { SALE_PAUSED: string }).SALE_PAUSED = "false"
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
    mockedGetEntity.mockResolvedValue(entitySnap)
    mockedPrePurchase.mockResolvedValue({ readyToPurchase: true })

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

  it("maps a revoked token (SonarAuthError) to 401", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockResolvedValue(entitySnap)
    mockedPrePurchase.mockRejectedValue(new SonarAuthError("expired"))
    const res = await prePurchasePOST(req({ wallet }))
    expect(res.status).toBe(401)
  })
})

describe("POST /api/sonar/generate-permit", () => {
  function req(body: unknown): Request {
    return new Request("http://test/api/sonar/generate-permit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  it("returns 503 when the sale is paused, before any auth or Sonar work", async () => {
    ;(env as { SALE_PAUSED: string }).SALE_PAUSED = "true"
    const res = await generatePermitPOST(req({ wallet }))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: "sale_paused" })
    expect(mockedGetSession).not.toHaveBeenCalled()
    expect(mockedGeneratePermit).not.toHaveBeenCalled()
  })

  it("returns 401 when the caller has no session", async () => {
    mockedGetSession.mockResolvedValue(sessionStub(undefined))
    const res = await generatePermitPOST(req({ wallet }))
    expect(res.status).toBe(401)
    expect(mockedGeneratePermit).not.toHaveBeenCalled()
  })

  it("returns 400 on a malformed wallet", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    const res = await generatePermitPOST(req({ wallet: "not-an-address" }))
    expect(res.status).toBe(400)
    expect(mockedGetEntity).not.toHaveBeenCalled()
  })

  it("returns 409 when the session has no entity", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockResolvedValue(null)
    const res = await generatePermitPOST(req({ wallet }))
    expect(res.status).toBe(409)
    expect(mockedGeneratePermit).not.toHaveBeenCalled()
  })

  it("derives the entity from the session and issues the permit (IDOR guard)", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockResolvedValue(entitySnap)
    mockedGeneratePermit.mockResolvedValue({ PermitJSON: {}, Signature: "0xsig" } as never)
    const res = await generatePermitPOST(req({ wallet, entityId: "attacker-entity" }))
    expect(res.status).toBe(200)
    expect(mockedGeneratePermit).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "sess-1", entityId: "server-entity", wallet }),
    )
  })

  it("maps a revoked token (SonarAuthError) to 401 so the client re-auths", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockResolvedValue(entitySnap)
    mockedGeneratePermit.mockRejectedValue(new SonarAuthError("expired"))
    const res = await generatePermitPOST(req({ wallet }))
    expect(res.status).toBe(401)
  })

  it("maps a permit dedup hit (PermitDedupError) to 429", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockResolvedValue(entitySnap)
    mockedGeneratePermit.mockRejectedValue(new PermitDedupError("too soon"))
    const res = await generatePermitPOST(req({ wallet }))
    expect(res.status).toBe(429)
  })

  it("maps an unknown Sonar failure to 502", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockResolvedValue(entitySnap)
    mockedGeneratePermit.mockRejectedValue(new Error("boom"))
    const res = await generatePermitPOST(req({ wallet }))
    expect(res.status).toBe(502)
  })
})

describe("GET /api/sonar/entity", () => {
  it("returns 401 when the caller has no session", async () => {
    mockedGetSession.mockResolvedValue(sessionStub(undefined))
    const res = await entityGET()
    expect(res.status).toBe(401)
    expect(mockedGetEntity).not.toHaveBeenCalled()
  })

  it("returns 404 when the session has no entity", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockResolvedValue(null)
    const res = await entityGET()
    expect(res.status).toBe(404)
  })

  it("returns the entity snapshot for an authenticated session", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockResolvedValue(entitySnap)
    const res = await entityGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(entitySnap)
  })

  it("maps a revoked token (SonarAuthError) to 401, not 502", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockRejectedValue(new SonarAuthError("expired"))
    const res = await entityGET()
    expect(res.status).toBe(401)
  })

  it("maps an unknown failure to 502", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedGetEntity.mockRejectedValue(new Error("boom"))
    const res = await entityGET()
    expect(res.status).toBe(502)
  })
})

describe("GET /api/sonar/my-position", () => {
  it("returns 401 when the caller has no session", async () => {
    mockedGetSession.mockResolvedValue(sessionStub(undefined))
    const res = await myPositionGET()
    expect(res.status).toBe(401)
    expect(mockedReadMyBid).not.toHaveBeenCalled()
  })

  it("returns the position for an authenticated session", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedReadMyBid.mockResolvedValue({ priceUsd: 0.2, committedUsd: 1000, lockup: false })
    const res = await myPositionGET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ priceUsd: 0.2, committedUsd: 1000, lockup: false })
  })

  it("maps a revoked token (SonarAuthError) to 401", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedReadMyBid.mockRejectedValue(new SonarAuthError("expired"))
    const res = await myPositionGET()
    expect(res.status).toBe(401)
  })

  it("maps an unknown failure to 502", async () => {
    mockedGetSession.mockResolvedValue(sessionStub("sess-1"))
    mockedReadMyBid.mockRejectedValue(new Error("boom"))
    const res = await myPositionGET()
    expect(res.status).toBe(502)
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

  it("on a session-bound callback, exchanges the code and stores the tokens under a ROTATED id", async () => {
    const session = sessionStub("s1")
    mockedGetSession.mockResolvedValue(session)
    mockedConsumePkce.mockResolvedValue({ sessionId: "s1", codeVerifier: "v" })
    const exchangeAuthorizationCode = vi
      .fn()
      .mockResolvedValue({ access_token: "at", refresh_token: "rt", expires_in: 3600 })
    mockedCreateSonarClient.mockReturnValue({
      exchangeAuthorizationCode,
    } as unknown as ReturnType<typeof createSonarClient>)

    const res = await callbackGET(cbReq("code=abc&state=xyz"))

    expect(res.headers.get("location")).toContain("auth=ok")
    // Session-fixation defense: the pre-auth id must never key the tokens - a fresh id does,
    // and any row under the retired id is dropped.
    const rotatedId = (session as unknown as { sessionId: string }).sessionId
    expect(rotatedId).not.toBe("s1")
    expect(mockedStoreTokens).toHaveBeenCalledWith(
      rotatedId,
      expect.objectContaining({ accessToken: "at", refreshToken: "rt" }),
    )
    expect(mockedDeleteTokens).toHaveBeenCalledWith("s1")
  })

  it("redirects to auth=error when code or state is missing", async () => {
    const res = await callbackGET(cbReq("code=abc"))
    expect(res.headers.get("location")).toContain("auth=error")
    expect(mockedConsumePkce).not.toHaveBeenCalled()
  })
})
