// @vitest-environment jsdom
/**
 * Funnel capability gate (lib/device/funnel-gate.ts): the single policy that
 * decides funnel UI (desktop) vs awareness-only UI (touch or < lg). Covers the
 * query constant, the CSS custom-variant staying in sync with it (globals.css
 * cannot import the TS constant), and the hook's reactive behavior.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { FUNNEL_MEDIA_QUERY, useFunnelCapable } from "../../../lib/device/funnel-gate"

type Listener = (e: { matches: boolean }) => void

/** Minimal matchMedia stub: one shared state + change-event fanout. */
function stubMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>()
  const state = { matches: initial }
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((media: string) => ({
      media,
      get matches() {
        return state.matches
      },
      addEventListener: (_: "change", cb: Listener) => listeners.add(cb),
      removeEventListener: (_: "change", cb: Listener) => listeners.delete(cb),
    })),
  )
  return {
    set(next: boolean) {
      state.matches = next
      for (const cb of listeners) cb({ matches: next })
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("FUNNEL_MEDIA_QUERY", () => {
  it("requires hover + fine pointer + Tailwind's lg width", () => {
    expect(FUNNEL_MEDIA_QUERY).toBe("(hover: hover) and (pointer: fine) and (min-width: 64rem)")
  })

  it("stays in sync with the `funnel` @custom-variant in globals.css", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")
    expect(css).toContain(`@custom-variant funnel (@media ${FUNNEL_MEDIA_QUERY});`)
  })
})

describe("useFunnelCapable", () => {
  it("reports a funnel-capable context", () => {
    stubMatchMedia(true)
    const { result } = renderHook(() => useFunnelCapable())
    expect(result.current).toBe(true)
  })

  it("reports an awareness-only context", () => {
    stubMatchMedia(false)
    const { result } = renderHook(() => useFunnelCapable())
    expect(result.current).toBe(false)
  })

  it("re-renders when the media query flips (resize across lg)", () => {
    const media = stubMatchMedia(true)
    const { result } = renderHook(() => useFunnelCapable())
    expect(result.current).toBe(true)
    act(() => media.set(false))
    expect(result.current).toBe(false)
    act(() => media.set(true))
    expect(result.current).toBe(true)
  })

  it("stops listening after unmount", () => {
    const media = stubMatchMedia(true)
    const { result, unmount } = renderHook(() => useFunnelCapable())
    unmount()
    // Flipping after unmount must not throw (listener removed).
    expect(() => act(() => media.set(false))).not.toThrow()
    expect(result.current).toBe(true)
  })
})
