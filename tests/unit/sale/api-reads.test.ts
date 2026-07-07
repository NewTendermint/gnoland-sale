import { afterEach, describe, expect, it, vi } from "vitest"
import { HttpError, getEntity, getMyPosition } from "../../../lib/sale/api"
import type { EntitySnapshot } from "../../../lib/sale/types"

const ENTITY: EntitySnapshot = {
  entityId: "11111111-1111-1111-1111-111111111111",
  setupState: "complete",
  eligibility: "eligible",
  investingRegion: "eu",
}

function stubFetch(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("getEntity (discriminated entity read)", () => {
  it("maps a 200 to the entity", async () => {
    stubFetch(200, ENTITY)
    expect(await getEntity()).toEqual({ status: "entity", entity: ENTITY })
  })

  it("maps a 401 to no-session", async () => {
    stubFetch(401, { error: "unauthenticated" })
    expect(await getEntity()).toEqual({ status: "no-session" })
  })

  it("maps a 404 to no-entity ONLY with the route's no_entity discriminant", async () => {
    stubFetch(404, { error: "no_entity" })
    expect(await getEntity()).toEqual({ status: "no-entity" })
  })

  it("treats a stray 404 without the discriminant as an error, not as an unstarted setup", async () => {
    // A deploy-window / rewrite / CDN 404 must not classify a possibly-verified user as
    // "session live, setup not started".
    stubFetch(404, "<html>not found</html>")
    await expect(getEntity()).rejects.toBeInstanceOf(HttpError)
  })
})

describe("getMyPosition", () => {
  it("maps a 200 null body to no bid", async () => {
    stubFetch(200, null)
    expect(await getMyPosition()).toBeNull()
  })

  it("maps a 401 to no bid (no session)", async () => {
    stubFetch(401, { error: "unauthenticated" })
    expect(await getMyPosition()).toBeNull()
  })

  it("treats a 404 as an error - the route never emits one, so it is stray infrastructure", async () => {
    // Classifying a stray 404 as "no bid" would show a fresh bid form to a live bidder.
    stubFetch(404, "<html>not found</html>")
    await expect(getMyPosition()).rejects.toBeInstanceOf(HttpError)
  })
})
