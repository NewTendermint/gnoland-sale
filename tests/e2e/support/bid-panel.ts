import { type Page, expect } from "@playwright/test"

// BidPanelDesktop always mounts collapsed on a fresh navigation/reload (bidPanelOpen is component
// state, reset on remount) even right after the mock Sonar login's ?auth=ok auto-expand - a
// reload always follows that in these specs (installMockWallet's addInitScript only takes effect
// on the next navigation). The exit condition is POSITIVE - the expanded header's Close button
// visible - never the absence of the collapsed trigger: during hydration the trigger is briefly
// unmounted, and an absence check exits vacuously with the panel still collapsed. Retried as a
// whole because the panel can also remount (and collapse again) right after a successful click.
export async function openBidPanel(page: Page): Promise<void> {
  const panel = page.locator('[data-component="bid-panel"]')
  const collapsedTrigger = panel.getByRole("button", { expanded: false })
  const closeButton = panel.getByRole("button", { name: "Close" })
  await expect(async () => {
    if ((await collapsedTrigger.count()) > 0) {
      await collapsedTrigger.first().click()
    }
    await expect(closeButton.first()).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 30_000 })
}
