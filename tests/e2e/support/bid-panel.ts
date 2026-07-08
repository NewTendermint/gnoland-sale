import { type Page, expect } from "@playwright/test"

// BidPanelDesktop always mounts collapsed on a fresh navigation/reload (bidPanelOpen is component
// state, reset on remount) even right after the mock Sonar login's ?auth=ok auto-expand - a
// reload always follows that in these specs (installMockWallet's addInitScript only takes effect
// on the next navigation). Once expanded the trigger unmounts (a CloseButton replaces it), so
// "collapsed trigger gone" is the open signal. Retried as a whole: under a slow dev-server
// compile the panel can remount AFTER a successful expand click, collapsing again and leaving
// the collapsed bar intercepting pointer events over the panel content.
export async function openBidPanel(page: Page): Promise<void> {
  const panel = page.locator('[data-component="bid-panel"]')
  // The panel mounts after hydration: without this, "no collapsed trigger" below is vacuously
  // true on a page whose panel hasn't rendered yet, and the helper returns without opening.
  await panel.first().waitFor({ state: "attached", timeout: 30_000 })
  const collapsedTrigger = panel.getByRole("button", { expanded: false })
  await expect(async () => {
    if ((await collapsedTrigger.count()) > 0) {
      await collapsedTrigger.first().click()
    }
    await expect(collapsedTrigger).toHaveCount(0, { timeout: 2_000 })
  }).toPass({ timeout: 20_000 })
}
