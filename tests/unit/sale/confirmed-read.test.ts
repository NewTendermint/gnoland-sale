import { beforeEach, describe, expect, it, vi } from "vitest"
import { readEntity, readMyPosition } from "../../../lib/sale/confirmed-read"
import { hasBidSeen, markBidSeen, markSonarSeen } from "../../../lib/sale/returning"
import type { EntitySnapshot, MyBid } from "../../../lib/sale/types"

const BID: MyBid = { priceUsd: 0.0645, committedUsd: 5, lockup: false }
const ENTITY: EntitySnapshot = {
  entityId: "11111111-1111-1111-1111-111111111111",
  setupState: "complete",
  eligibility: "eligible",
  investingRegion: "eu",
}
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
})

describe("readEntity (null-confirming entity read)", () => {
  it("returns the entity straight through", async () => {
    const fetcher = vi.fn().mockResolvedValue(ENTITY)
    expect(await readEntity(fetcher, DELAY)).toEqual(ENTITY)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("accepts a null immediately for a first-time visitor (no sonar-seen flag)", async () => {
    const fetcher = vi.fn().mockResolvedValue(null)
    expect(await readEntity(fetcher, DELAY)).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it("re-reads a suspect null (entity seen before) and returns the recovered entity", async () => {
    markSonarSeen()
    const fetcher = vi.fn().mockResolvedValueOnce(null).mockResolvedValue(ENTITY)
    expect(await readEntity(fetcher, DELAY)).toEqual(ENTITY)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("still surfaces a real signed-out state after the bounded confirms", async () => {
    markSonarSeen()
    const fetcher = vi.fn().mockResolvedValue(null)
    expect(await readEntity(fetcher, DELAY)).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(3) // initial + 2 confirms
  })
})
