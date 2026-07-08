import { expect, test } from "../fixtures"
import { openBidPanel } from "../support/bid-panel"

// Minimal 1x1 SVG data URI: EIP-6963 requires an icon field but the app never inspects its
// content for these assertions.
const ICON = "data:image/svg+xml;base64,PHN2Zy8+"

const METAMASK = {
  uuid: "11111111-0000-0000-0000-000000000001",
  name: "MetaMask",
  icon: ICON,
  rdns: "io.metamask",
}
const RABBY = {
  uuid: "22222222-0000-0000-0000-000000000002",
  name: "Rabby",
  icon: ICON,
  rdns: "io.rabby",
}
const GENERIC = {
  uuid: "33333333-0000-0000-0000-000000000003",
  name: "Generic Wallet",
  icon: ICON,
  rdns: "com.example.genericwallet",
}

test.beforeEach(async ({ sonar }) => {
  await sonar.login()
})

test("WAL-05: an uninstalled recommended wallet shows a greyed install prompt opening in a new tab", async ({
  page,
}) => {
  await page.reload()
  await openBidPanel(page)
  const installLink = page.getByRole("link", { name: /Get MetaMask/i })
  await expect(installLink).toBeVisible()
  await expect(installLink).toHaveAttribute("href", "https://metamask.io/download/")
  await expect(installLink).toHaveAttribute("target", "_blank")
})

test("WAL-06: a wallet announced without an icon falls back to the generic wallet icon, no broken image", async ({
  page,
  wallet,
}) => {
  const NO_ICON = {
    uuid: "44444444-0000-0000-0000-000000000004",
    name: "No Icon Wallet",
    icon: "",
    rdns: "com.example.noicon",
  }
  await wallet.install({ info: NO_ICON })
  await page.reload()
  await openBidPanel(page)
  const button = page.getByRole("button", { name: `Connect ${NO_ICON.name}` })
  await expect(button).toBeVisible()
  await expect(button.locator("img")).toHaveCount(0)
  // Not just "no broken <img>": the fallback glyph must actually have drawn something - an
  // empty <svg> (e.g. a renamed key in Icon's untyped PATHS map) would otherwise pass.
  await expect(button.locator("svg *").first()).toBeAttached()
})

test("WAL-07: an installed wallet (not one of the recommended three) still appears live with its own icon", async ({
  page,
  wallet,
}) => {
  await wallet.install({ info: GENERIC })
  await page.reload()
  await openBidPanel(page)
  const button = page.getByRole("button", { name: `Connect ${GENERIC.name}` })
  await expect(button).toBeVisible()
  await expect(button).toBeEnabled()
  await expect(button.locator("img")).toHaveAttribute("src", GENERIC.icon)
})

test("WAL-08: the find-a-wallet link opens ethereum.org's wallet finder in a new tab", async ({
  page,
}) => {
  await page.reload()
  await openBidPanel(page)
  const link = page.getByRole("link", { name: /Don't have a wallet\? Find one/i })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute("href", "https://ethereum.org/wallets/find-wallet/")
  await expect(link).toHaveAttribute("target", "_blank")
})

test("a recommended wallet goes from install-prompt to live once installed", async ({
  page,
  wallet,
}) => {
  await page.reload()
  await openBidPanel(page)
  await expect(page.getByRole("link", { name: /Get MetaMask/i })).toBeVisible()

  await wallet.install({ info: METAMASK })
  await page.reload()
  await openBidPanel(page)

  await expect(page.getByRole("link", { name: /Get MetaMask/i })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "Connect MetaMask" })).toBeVisible()
})

test("two installed wallets sharing a display name dedupe to one picker button", async ({
  page,
  wallet,
}) => {
  const secondMetaMask = {
    ...METAMASK,
    uuid: "11111111-0000-0000-0000-000000000099",
    rdns: "io.metamask.duplicate",
  }
  await wallet.install({ info: METAMASK })
  await wallet.install({ info: secondMetaMask })
  await page.reload()
  await openBidPanel(page)

  await expect(page.getByRole("button", { name: "Connect MetaMask" })).toHaveCount(1)
})

test("Rabby (a recommended wallet) is offered install + connect like MetaMask", async ({
  page,
  wallet,
}) => {
  await wallet.install({ info: RABBY })
  await page.reload()
  await openBidPanel(page)
  await expect(page.getByRole("button", { name: "Connect Rabby" })).toBeVisible()
})
