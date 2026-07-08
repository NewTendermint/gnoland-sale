import { fireEvent, render, screen } from "@testing-library/react"
import { createElement } from "react"
import { describe, expect, it, vi } from "vitest"
import { ManageEntityCta, SonarSignOutButton } from "../../app/(sections)/bid/ManageEntity"

describe("SonarSignOutButton", () => {
  it("is an accessible button that fires the sign-out callback", () => {
    const onSignOut = vi.fn()
    render(createElement(SonarSignOutButton, { onSignOut }))
    const button = screen.getByRole("button", { name: "Sign out of Sonar" })
    expect(button).toHaveAttribute("title", "Sign out of Sonar")
    expect(button).toHaveAttribute("type", "button")
    fireEvent.click(button)
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it("hides its glyph from assistive tech (the label carries the semantics)", () => {
    render(createElement(SonarSignOutButton, { onSignOut: () => {} }))
    const svg = screen.getByRole("button").querySelector("svg")
    expect(svg?.getAttribute("aria-hidden")).toBe("true")
  })
})

describe("ManageEntityCta with a sign-out handler", () => {
  it("keeps navigation and sign-out as two distinct controls (no nested interactives)", () => {
    const onSignOut = vi.fn()
    render(createElement(ManageEntityCta, { href: "https://echo.test/sonar/x", onSignOut }))
    const link = screen.getByRole("link", { name: "Manage your Sonar account" })
    expect(link).toHaveAttribute("href", "https://echo.test/sonar/x")
    const button = screen.getByRole("button", { name: "Sign out of Sonar" })
    // A button nested inside a link is invalid HTML and breaks screen readers.
    expect(link.contains(button)).toBe(false)
    fireEvent.click(button)
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it("renders no sign-out control without a handler", () => {
    render(createElement(ManageEntityCta, { href: "https://echo.test/sonar/x" }))
    expect(screen.queryByRole("button", { name: "Sign out of Sonar" })).toBeNull()
  })
})
