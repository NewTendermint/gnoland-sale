import type { Page } from "@playwright/test"

// BidPanelDesktop always mounts collapsed on a fresh navigation/reload (bidPanelOpen is component
// state, reset on remount) even right after the mock Sonar login's ?auth=ok auto-expand - a
// reload always follows that in these specs (installMockWallet's addInitScript only takes effect
// on the next navigation). The trigger carries aria-expanded either way, so this is a no-op when
// already open.
export async function openBidPanel(page: Page): Promise<void> {
  const trigger = page
    .locator('[data-component="bid-panel"]')
    .getByRole("button", { expanded: false })
  if ((await trigger.count()) > 0) {
    await trigger.click()
  }
}
