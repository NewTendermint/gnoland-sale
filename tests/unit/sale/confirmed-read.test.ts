import { beforeEach, describe, expect, it, vi } from "vitest"
import type { EntityRead } from "../../../lib/sale/api"
import { readEntity, readMyPosition } from "../../../lib/sale/confirmed-read"
import { clearBidSeen, hasBidSeen, markBidSeen, markSonarSeen } from "../../../lib/sale/returning"
import type { EntitySnapshot, MyBid } from "../../../lib/sale/types"

const BID: MyBid = { priceUsd: 0.0645, committedUsd: 5 }
const ENTITY: EntitySnapshot = {
  entityId: "11111111-1111-1111-1111-111111111111",
  setupState: "complete",
  eligibility: "eligible",
  investingRegion: "eu",
  label: "Test Entity",
}
const ENTITY_READ: EntityRead = { status: "entity", entity: ENTITY }
const NO_SESSION: EntityRead = { status: "no-session" }
const NO_ENTITY: EntityRead = { status: "no-entity" }
// Near-zero confirm delay keeps the retry paths fast in tests.
const DELAY = 1

beforeEach(() => {
  window.localStorage.clear()
})

describe("readMyPosition (null-confirming my-position read)", () => {
  it("returns a live bid and records the bid-seen flag", async () => {
    const fetcher = vi.fn().mockResolvedValue(BID)
    expect(await readMyPosition(fetcher, DELAY)).toEqual(BID)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(hasBidSeen()).toBe(true)
  })

  it("accepts a null immediately when this browser has never seen a bid", async () => {
    const fetcher = vi.fn().mockResolvedValue(null)
    expect(await readMyPosition(fetcher, DELAY)).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("re-reads a suspect null (bid seen before) and returns the recovered bid", async () => {
    markBidSeen()
    const fetcher = vi.fn().mockResolvedValueOnce(null).mockResolvedValue(BID)
    expect(await readMyPosition(fetcher, DELAY)).toEqual(BID)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("accepts the null after the bounded confirms all come back empty", async () => {
    markBidSeen()
    const fetcher = vi.fn().mockResolvedValue(null)
    expect(await readMyPosition(fetcher, DELAY)).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(3) // initial + 2 confirms
  })

  it("resolves a null in one read once the bid-seen flag is cleared (sign-out fresh state)", async () => {
    markBidSeen()
    clearBidSeen()
    const fetcher = vi.fn().mockResolvedValue(null)
    expect(await readMyPosition(fetcher, DELAY)).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe("readEntity (empty-confirming entity read)", () => {
  it("returns the entity straight through", async () => {
    const fetcher = vi.fn().mockResolvedValue(ENTITY_READ)
    expect(await readEntity(fetcher, DELAY)).toEqual(ENTITY_READ)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("accepts a no-session immediately for a first-time visitor (no sonar-seen flag)", async () => {
    const fetcher = vi.fn().mockResolvedValue(NO_SESSION)
    expect(await readEntity(fetcher, DELAY)).toEqual(NO_SESSION)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("always confirms a no-entity answer, even on a first-time browser (post-OAuth race)", async () => {
    // The riskiest empty is the first read right after an OAuth return: no sonar-seen flag yet,
    // but Sonar may still be materializing the entity - a single empty must not stick.
    const fetcher = vi.fn().mockResolvedValueOnce(NO_ENTITY).mockResolvedValue(ENTITY_READ)
    expect(await readEntity(fetcher, DELAY)).toEqual(ENTITY_READ)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("settles on no-entity after the bounded confirms all come back empty", async () => {
    const fetcher = vi.fn().mockResolvedValue(NO_ENTITY)
    expect(await readEntity(fetcher, DELAY)).toEqual(NO_ENTITY)
    expect(fetcher).toHaveBeenCalledTimes(3) // initial + 2 confirms
  })

  it("re-reads a suspect empty answer (entity seen before) and returns the recovered entity", async () => {
    markSonarSeen()
    const fetcher = vi.fn().mockResolvedValueOnce(NO_ENTITY).mockResolvedValue(ENTITY_READ)
    expect(await readEntity(fetcher, DELAY)).toEqual(ENTITY_READ)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("still surfaces a real signed-out state after the bounded confirms", async () => {
    markSonarSeen()
    const fetcher = vi.fn().mockResolvedValue(NO_SESSION)
    expect(await readEntity(fetcher, DELAY)).toEqual(NO_SESSION)
    expect(fetcher).toHaveBeenCalledTimes(3) // initial + 2 confirms
  })
})
