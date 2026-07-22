import { fireEvent, render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import type { ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"
import { ManageEntityCta, SonarSignOutButton } from "../../app/[locale]/(sections)/bid/ManageEntity"
import messages from "../../messages/en.json"

// These components read labels via useTranslations("Bid"); render them under the English catalog
// so the accessible-name assertions below match the shipped English copy.
function renderIntl(element: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {element}
    </NextIntlClientProvider>,
  )
}

describe("SonarSignOutButton", () => {
  it("is an accessible button that fires the sign-out callback", () => {
    const onSignOut = vi.fn()
    renderIntl(<SonarSignOutButton onSignOut={onSignOut} />)
    const button = screen.getByRole("button", { name: "Sign out of Sonar" })
    expect(button).toHaveAttribute("title", "Sign out of Sonar")
    expect(button).toHaveAttribute("type", "button")
    fireEvent.click(button)
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it("hides its glyph from assistive tech (the label carries the semantics)", () => {
    renderIntl(<SonarSignOutButton onSignOut={() => {}} />)
    const svg = screen.getByRole("button").querySelector("svg")
    expect(svg?.getAttribute("aria-hidden")).toBe("true")
  })
})

describe("ManageEntityCta with a sign-out handler", () => {
  it("keeps navigation and sign-out as two distinct controls (no nested interactives)", () => {
    const onSignOut = vi.fn()
    renderIntl(<ManageEntityCta href="https://echo.test/sonar/x" onSignOut={onSignOut} />)
    const link = screen.getByRole("link", { name: "Manage your Sonar account" })
    expect(link).toHaveAttribute("href", "https://echo.test/sonar/x")
    const button = screen.getByRole("button", { name: "Sign out of Sonar" })
    // A button nested inside a link is invalid HTML and breaks screen readers.
    expect(link.contains(button)).toBe(false)
    fireEvent.click(button)
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it("renders no sign-out control without a handler", () => {
    renderIntl(<ManageEntityCta href="https://echo.test/sonar/x" />)
    expect(screen.queryByRole("button", { name: "Sign out of Sonar" })).toBeNull()
  })
})
