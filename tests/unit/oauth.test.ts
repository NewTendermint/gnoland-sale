import { beforeEach, describe, expect, it, vi } from "vitest"

// oauth.ts now keeps PKCE state in Postgres (pkce_states), consumed via an atomic
// DELETE ... RETURNING (the single-use guarantee). Mock the db client so the test drives
// exactly that one query's result. Defined via vi.hoisted so the vi.mock factory can reference it.
const { dbMock } = vi.hoisted(() => {
  const state = { rows: [] as Array<Record<string, unknown>>, deleteCalls: 0 }
  return {
    dbMock: {
      state,
      db: {
        delete: () => {
          state.deleteCalls++
          return { where: () => ({ returning: async () => state.rows }) }
        },
      },
    },
  }
})

vi.mock("../../lib/db/client", () => ({ db: dbMock.db }))

import { consumePkceState } from "../../lib/sonar/oauth"

describe("consumePkceState (Postgres pkce_states, single-use)", () => {
  beforeEach(() => {
    dbMock.state.rows = []
    dbMock.state.deleteCalls = 0
  })

  it("returns the payload for a valid, unexpired row and consumes it via an atomic delete", async () => {
    dbMock.state.rows = [
      {
        state: "state-1",
        sessionId: "s1",
        codeVerifier: "v1",
        expiresAt: new Date(Date.now() + 60_000),
      },
    ]
    const payload = await consumePkceState("state-1")
    expect(payload).toEqual({ sessionId: "s1", codeVerifier: "v1" })
    // Single-use: consumed via DELETE ... RETURNING, never a read-then-delete.
    expect(dbMock.state.deleteCalls).toBe(1)
  })

  it("throws for an expired row (already removed by the same atomic delete)", async () => {
    dbMock.state.rows = [
      {
        state: "state-2",
        sessionId: "s2",
        codeVerifier: "v2",
        expiresAt: new Date(Date.now() - 1),
      },
    ]
    await expect(consumePkceState("state-2")).rejects.toThrow(/expired/i)
    expect(dbMock.state.deleteCalls).toBe(1)
  })

  it("throws for a missing or already-consumed state (no row returned)", async () => {
    dbMock.state.rows = []
    await expect(consumePkceState("does-not-exist")).rejects.toThrow(/not found/i)
    expect(dbMock.state.deleteCalls).toBe(1)
  })
})
