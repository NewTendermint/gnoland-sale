import { expect, test } from "../fixtures"
import { openBidPanel } from "../support/bid-panel"

const ICON = "data:image/svg+xml;base64,PHN2Zy8+"
// MockWalletHandler defaults to chainId 1 (mainnet) - the sale runs on sepolia, so a fresh
// connection always lands on the wrong-network gate unless the spec asks for a different chain.
const METAMASK = {
  uuid: "55555555-0000-0000-0000-000000000001",
  name: "MetaMask",
  icon: ICON,
  rdns: "io.metamask",
}

test("WAL-15: connecting on the wrong network shows the wrong-network gate", async ({
  page,
  wallet,
  sonar,
}) => {
  await sonar.login()
  await wallet.install({ info: METAMASK })
  await page.reload()
  await openBidPanel(page)
  await page.getByRole("button", { name: "Connect MetaMask" }).click()

  await expect(page.getByText("Wrong network.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Switch to Sepolia" })).toBeVisible()
})

test("WAL-16: switching to the sale chain clears the gate and shows the bid form", async ({
  page,
  wallet,
  sonar,
}) => {
  await sonar.login()
  await wallet.install({ info: METAMASK })
  await page.reload()
  await openBidPanel(page)
  await page.getByRole("button", { name: "Connect MetaMask" }).click()
  await expect(page.getByText("Wrong network.")).toBeVisible()

  await page.getByRole("button", { name: "Switch to Sepolia" }).click()

  await expect(page.getByRole("button", { name: "Place bid" })).toBeVisible()
  await expect(page.getByText("Wrong network.")).toHaveCount(0)
})

test("WAL-17: a failed network switch shows an error and keeps the gate up", async ({
  page,
  wallet,
  sonar,
}) => {
  await sonar.login()
  await wallet.install({ info: METAMASK, switchChainBehavior: "reject" })
  await page.reload()
  await openBidPanel(page)
  await page.getByRole("button", { name: "Connect MetaMask" }).click()
  await expect(page.getByText("Wrong network.")).toBeVisible()

  await page.getByRole("button", { name: "Switch to Sepolia" }).click()

  await expect(page.getByText("Could not switch. Try again.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Switch to Sepolia" })).toBeVisible()
})
