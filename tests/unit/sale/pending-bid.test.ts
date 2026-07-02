import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  PENDING_BID_TTL_MS,
  type PendingBid,
  clearPendingBid,
  derivePendingView,
  readPendingBid,
  reconcilePendingBid,
  writePendingBid,
} from "../../../lib/sale/pending-bid"
import type { MyBid } from "../../../lib/sale/types"

const ADDR = "0xAbC0000000000000000000000000000000000001"
const OTHER = "0xDef0000000000000000000000000000000000002"
const BID = { committedUsd: 500, priceUsd: 0.0645, lockup: false }
const PENDING: PendingBid = { ...BID, address: ADDR.toLowerCase(), timestamp: 0 }
const SONAR_LOWER: MyBid = { committedUsd: 200, priceUsd: 0.06, lockup: false }
const SONAR_CAUGHT_UP: MyBid = { committedUsd: 500, priceUsd: 0.0645, lockup: false }

beforeEach(() => {
  window.localStorage.clear()
  clearPendingBid() // resets the in-memory fallback between tests
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("writePendingBid / readPendingBid", () => {
  it("round-trips the entry for the same wallet, case-insensitively", () => {
    writePendingBid(BID, ADDR)
    const entry = readPendingBid(ADDR.toUpperCase())
    expect(entry).toMatchObject({ ...BID, address: ADDR.toLowerCase() })
    expect(entry?.timestamp).toBeTypeOf("number")
  })

  it("returns null past the TTL", () => {
    writePendingBid(BID, ADDR)
    expect(readPendingBid(ADDR, Date.now() + PENDING_BID_TTL_MS + 1)).toBeNull()
  })

  it("stays valid at exactly the TTL boundary", () => {
    writePendingBid(BID, ADDR)
    const entry = readPendingBid(ADDR)
    expect(readPendingBid(ADDR, (entry?.timestamp ?? 0) + PENDING_BID_TTL_MS)).not.toBeNull()
  })

  it("ignores a different wallet's entry without purging it", () => {
    writePendingBid(BID, ADDR)
    expect(readPendingBid(OTHER)).toBeNull()
    expect(readPendingBid(ADDR)).not.toBeNull()
  })

  it("returns null when no wallet is connected", () => {
    writePendingBid(BID, ADDR)
    expect(readPendingBid(undefined)).toBeNull()
  })

  it("returns null on a malformed entry", () => {
    window.localStorage.setItem("gnot:pending-bid", "{not json")
    expect(readPendingBid(ADDR)).toBeNull()
    window.localStorage.setItem("gnot:pending-bid", JSON.stringify({ committedUsd: "500" }))
    expect(readPendingBid(ADDR)).toBeNull()
  })

  it("clears", () => {
    writePendingBid(BID, ADDR)
    clearPendingBid()
    expect(readPendingBid(ADDR)).toBeNull()
  })

  it("survives a blocked localStorage via the in-memory fallback (session only)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    writePendingBid(BID, ADDR)
    expect(readPendingBid(ADDR)).toMatchObject(BID)
    clearPendingBid()
    expect(readPendingBid(ADDR)).toBeNull()
  })
})

describe("derivePendingView (the single pending derivation)", () => {
  it("passes Sonar through when no pending bid exists", () => {
    expect(derivePendingView(null, null)).toEqual({
      myBid: null,
      pendingIndexing: false,
      delta: null,
    })
    expect(derivePendingView(null, SONAR_LOWER)).toEqual({
      myBid: SONAR_LOWER,
      pendingIndexing: false,
      delta: null,
    })
    expect(derivePendingView(null, undefined).myBid).toBeNull()
  })

  it("shows the position but NO chips while the Sonar read is unresolved", () => {
    // A raise's baseline is unknown before the read settles: claiming "+1 pending" or the full
    // amount would overcount, so only the position (safe either way) renders.
    expect(derivePendingView(PENDING, undefined)).toEqual({
      myBid: BID,
      pendingIndexing: true,
      delta: null,
    })
  })

  it("keeps the pending position and stays neutral on a same-amount price raise", () => {
    const sonarOldPrice: MyBid = { committedUsd: 500, priceUsd: 0.043, lockup: false }
    expect(derivePendingView(PENDING, sonarOldPrice)).toEqual({
      myBid: BID,
      pendingIndexing: true,
      delta: null,
    })
  })

  it("flags a first bid as a new bidder for its full amount", () => {
    expect(derivePendingView(PENDING, null)).toEqual({
      myBid: BID,
      pendingIndexing: true,
      delta: { amountUsd: 500, newBidder: true },
    })
  })

  it("reports only the delta on a raise, with no new bidder", () => {
    expect(derivePendingView(PENDING, SONAR_LOWER)).toEqual({
      myBid: BID,
      pendingIndexing: true,
      delta: { amountUsd: 300, newBidder: false },
    })
  })

  it("drops the chips once Sonar reports the amount (entry purge is reconcile's job)", () => {
    expect(derivePendingView(PENDING, SONAR_CAUGHT_UP)).toEqual({
      myBid: BID,
      pendingIndexing: true,
      delta: null,
    })
  })
})

describe("reconcilePendingBid", () => {
  it("purges the entry once Sonar reports the amount AND the price", () => {
    writePendingBid(BID, ADDR)
    reconcilePendingBid(SONAR_CAUGHT_UP, ADDR)
    expect(readPendingBid(ADDR)).toBeNull()
  })

  it("keeps the entry while Sonar lags (null or lower)", () => {
    writePendingBid(BID, ADDR)
    reconcilePendingBid(null, ADDR)
    reconcilePendingBid(SONAR_LOWER, ADDR)
    expect(readPendingBid(ADDR)).not.toBeNull()
  })

  it("keeps the entry when the amount matches but the price is still the old one", () => {
    writePendingBid(BID, ADDR)
    reconcilePendingBid({ committedUsd: 500, priceUsd: 0.043, lockup: false }, ADDR)
    expect(readPendingBid(ADDR)).not.toBeNull()
  })

  it("tolerates float noise on the reported price", () => {
    writePendingBid(BID, ADDR)
    reconcilePendingBid({ ...SONAR_CAUGHT_UP, priceUsd: 0.0645 + 1e-12 }, ADDR)
    expect(readPendingBid(ADDR)).toBeNull()
  })

  it("never touches another wallet's entry", () => {
    writePendingBid(BID, ADDR)
    reconcilePendingBid(SONAR_CAUGHT_UP, OTHER)
    expect(readPendingBid(ADDR)).not.toBeNull()
  })
})
