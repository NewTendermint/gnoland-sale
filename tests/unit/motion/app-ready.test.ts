import { describe, expect, it, vi } from "vitest"

// Fresh module per test: the gate is a one-way latch in module state.
async function freshModule() {
  vi.resetModules()
  return await import("../../../lib/motion/app-ready")
}

describe("app-ready gate", () => {
  it("queues whenReady callbacks and fires them in order on signalAppReady", async () => {
    const { whenReady, signalAppReady } = await freshModule()
    const calls: string[] = []
    whenReady(() => calls.push("a"))
    whenReady(() => calls.push("b"))
    expect(calls).toEqual([])
    signalAppReady()
    expect(calls).toEqual(["a", "b"])
  })

  it("fires whenReady synchronously once already ready", async () => {
    const { whenReady, signalAppReady } = await freshModule()
    signalAppReady()
    let fired = false
    whenReady(() => {
      fired = true
    })
    expect(fired).toBe(true)
  })

  it("signalAppReady is idempotent (each waiter fires at most once)", async () => {
    const { whenReady, signalAppReady } = await freshModule()
    let count = 0
    whenReady(() => count++)
    signalAppReady()
    signalAppReady()
    expect(count).toBe(1)
  })

  it("unsubscribe drops a waiter queued before ready", async () => {
    const { whenReady, signalAppReady } = await freshModule()
    let fired = false
    const off = whenReady(() => {
      fired = true
    })
    off()
    signalAppReady()
    expect(fired).toBe(false)
  })

  it("hero media gate is independent of the app-ready gate", async () => {
    const { whenHeroMediaReady, signalHeroMediaReady, whenReady } = await freshModule()
    const order: string[] = []
    whenReady(() => order.push("app"))
    whenHeroMediaReady(() => order.push("hero"))
    signalHeroMediaReady()
    expect(order).toEqual(["hero"])
  })
})
