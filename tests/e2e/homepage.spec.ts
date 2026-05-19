import { expect, test } from "@playwright/test"

test("homepage renders all sections", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /GNOT Public/i })).toBeVisible()
  const ids = [
    "sale-metrics",
    "how-it-works",
    "token-details",
    "transparency",
    "narrative",
    "features",
    "gnot-utility",
    "stats",
    "roadmap",
    "ecosystem",
    "team",
    "investors",
    "partners",
    "media",
    "pre-footer-cta",
  ]
  for (const id of ids) {
    await expect(page.locator(`#${id}`)).toBeVisible()
  }
})

test("anchor navigation works", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("link", { name: /Roadmap/i }).click()
  await expect(page).toHaveURL(/#roadmap$/)
})
