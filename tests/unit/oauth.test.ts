import { beforeEach, describe, expect, it, vi } from "vitest"

// In-memory fake of the Netlify Blobs store, defined via vi.hoisted so the
// vi.mock factory (hoisted above imports) can reference it.
const { store } = vi.hoisted(() => {
  const entries = new Map<string, { data: unknown; metadata: Record<string, unknown> }>()
  return {
    store: {
      entries,
      setJSON: async (
        key: string,
        data: unknown,
        opts?: { metadata?: Record<string, unknown> },
      ) => {
        entries.set(key, { data, metadata: opts?.metadata ?? {} })
      },
      getWithMetadata: async (key: string) => entries.get(key) ?? null,
      delete: async (key: string) => {
        entries.delete(key)
      },
    },
  }
})

vi.mock("@netlify/blobs", () => ({ getStore: () => store }))

import { consumePkceState } from "../../lib/sonar/oauth"

describe("consumePkceState", () => {
  beforeEach(() => store.entries.clear())

  it("returns the payload for a valid, unexpired state and consumes it (single-use)", async () => {
    store.entries.set("state-1", {
      data: { sessionId: "s1", codeVerifier: "v1" },
      metadata: { expiresAt: Date.now() + 60_000 },
    })
    const payload = await consumePkceState("state-1")
    expect(payload).toEqual({ sessionId: "s1", codeVerifier: "v1" })
    // Single-use: the state must be gone after a successful consume.
    expect(store.entries.has("state-1")).toBe(false)
  })

  it("throws for an expired state and still deletes it", async () => {
    store.entries.set("state-2", {
      data: { sessionId: "s2", codeVerifier: "v2" },
      metadata: { expiresAt: Date.now() - 1 },
    })
    await expect(consumePkceState("state-2")).rejects.toThrow(/expired/i)
    expect(store.entries.has("state-2")).toBe(false)
  })

  it("throws for a missing state", async () => {
    await expect(consumePkceState("does-not-exist")).rejects.toThrow(/not found/i)
  })

  it("throws when the expiry metadata is absent or malformed", async () => {
    store.entries.set("state-3", {
      data: { sessionId: "s3", codeVerifier: "v3" },
      metadata: {},
    })
    await expect(consumePkceState("state-3")).rejects.toThrow(/expired/i)
    expect(store.entries.has("state-3")).toBe(false)
  })
})
