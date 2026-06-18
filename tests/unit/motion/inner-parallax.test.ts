import { cleanup, render } from "@testing-library/react"
import { createElement } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { computeDriftY, useInnerParallax } from "../../../lib/motion/use-inner-parallax"

// maxTravel 100, viewport 1000, element height 200. The drift maps the element's FULL pass
// (top edge entering at the bottom -> bottom edge leaving at the top) onto [-max, +max]:
// inner content drifts UP as the slot rises.
describe("computeDriftY", () => {
  it("is 0 when the element is centered in the viewport", () => {
    expect(computeDriftY(400, 200, 1000, 100)).toBeCloseTo(0)
  })

  it("pins to +maxTravel only once the element is FULLY entering (top at the viewport bottom)", () => {
    expect(computeDriftY(1000, 200, 1000, 100)).toBeCloseTo(100)
  })

  it("pins to -maxTravel only once the element has FULLY left (bottom at the viewport top)", () => {
    expect(computeDriftY(-200, 200, 1000, 100)).toBeCloseTo(-100)
  })

  it("keeps drifting (NOT pinned) while the element is still half on screen", () => {
    // Centre at the viewport top: the bottom half is still visible, so the drift must not be
    // frozen at -max yet.
    expect(computeDriftY(-100, 200, 1000, 100)).toBeCloseTo(-83.33)
  })

  it("is symmetric: half-entering drifts the same magnitude as half-left", () => {
    expect(computeDriftY(900, 200, 1000, 100)).toBeCloseTo(83.33)
  })

  it("returns 0 for a zero/negative viewport (no layout yet)", () => {
    expect(computeDriftY(400, 200, 0, 100)).toBe(0)
  })
})

// Minimal matchMedia stub: a fixed `matches` for every query.
function stubReduced(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((media: string) => ({
      media,
      matches: reduce,
      addEventListener() {},
      removeEventListener() {},
    })),
  )
}

function Probe() {
  const ref = useInnerParallax<HTMLDivElement>()
  return createElement("div", { ref, "data-testid": "drift" })
}

describe("useInnerParallax lifecycle", () => {
  let screen: HTMLElement
  beforeEach(() => {
    screen = document.createElement("div")
    screen.className = "screen"
    document.body.appendChild(screen)
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    screen.remove()
  })

  it("subscribes one passive scroll listener on .screen, removes it on unmount", () => {
    stubReduced(false)
    const add = vi.spyOn(screen, "addEventListener")
    const remove = vi.spyOn(screen, "removeEventListener")
    // Render in the DEFAULT container (not into `.screen`), so React's own listeners
    // land elsewhere and the spy on `.screen` catches only our hook's scroll listener.
    const { unmount } = render(createElement(Probe))
    expect(add).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true })
    unmount()
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function))
  })

  it("does not subscribe under prefers-reduced-motion", () => {
    stubReduced(true)
    const add = vi.spyOn(screen, "addEventListener")
    render(createElement(Probe))
    expect(add).not.toHaveBeenCalledWith("scroll", expect.any(Function), expect.anything())
  })
})
