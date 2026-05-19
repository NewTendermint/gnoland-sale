import { expect, test } from "@playwright/test"

test("homepage renders", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /GNOT Token Sale/i })).toBeVisible()
})
