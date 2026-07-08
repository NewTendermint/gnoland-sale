import { expect, test } from "../fixtures"
import { openBidPanel } from "../support/bid-panel"
import { SEPOLIA_CHAIN_ID } from "../support/constants"

// Wallets install BEFORE sonar.login(): the login's navigation runs the init script and lands on
// /?auth=ok, which auto-opens the bid panel (see wallet-picker.spec.ts for the rationale). Only
// WAL-12 reloads mid-test - the one place openBidPanel is still needed.

const ICON = "data:image/svg+xml;base64,PHN2Zy8+"
const METAMASK = {
  uuid: "44444444-0000-0000-0000-000000000001",
  name: "MetaMask",
  icon: ICON,
  rdns: "io.metamask",
}

test("mock Sonar login lands on the wallet picker (journey precondition)", async ({
  page,
  sonar,
}) => {
  await sonar.login()
  await expect(page.getByText("Connect your wallet.")).toBeVisible()
})

test("WAL-01: connecting a wallet replaces the picker with the bid form (mock analog)", async ({
  page,
  wallet,
  sonar,
}) => {
  await wallet.install({ info: METAMASK, chainId: SEPOLIA_CHAIN_ID })
  await sonar.login()

  await page.getByRole("button", { name: "Connect MetaMask" }).click()

  await expect(page.getByRole("button", { name: "Place bid" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Connect MetaMask" })).toHaveCount(0)
})

test("WAL-10: a rejected connection shows an error and stays on the picker", async ({
  page,
  wallet,
  sonar,
}) => {
  await wallet.install({ info: METAMASK, requestAccountsBehavior: "reject" })
  await sonar.login()

  await page.getByRole("button", { name: "Connect MetaMask" }).click()

  await expect(page.getByText("Connection failed. Try again.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Connect MetaMask" })).toBeVisible()
})

test("WAL-09: the picker shows a pending state while a connection is in flight", async ({
  page,
  wallet,
  sonar,
}) => {
  await wallet.install({
    info: METAMASK,
    chainId: SEPOLIA_CHAIN_ID,
    requestAccountsDelayMs: 1000,
  })
  await sonar.login()

  const button = page.getByRole("button", { name: "Connect MetaMask" })
  await button.click()

  await expect(button).toBeDisabled()
  await expect(page.getByRole("button", { name: "Place bid" })).toBeVisible()
})

test("WAL-12: a connected wallet reconnects automatically across a reload", async ({
  page,
  wallet,
  sonar,
}) => {
  const handler = await wallet.install({ info: METAMASK, chainId: SEPOLIA_CHAIN_ID })
  await sonar.login()
  await page.getByRole("button", { name: "Connect MetaMask" }).click()
  await expect(page.getByRole("button", { name: "Place bid" })).toBeVisible()
  const promptsBeforeReload = handler.requestAccountsCalls()

  await page.reload()
  await openBidPanel(page)

  await expect(page.getByRole("button", { name: "Place bid" })).toBeVisible()
  // SILENT is the point: the reconnect must come from eth_accounts (a permissionless read),
  // never a fresh eth_requestAccounts - on a real wallet that pops a new permission prompt.
  expect(handler.requestAccountsCalls()).toBe(promptsBeforeReload)
})

test("WAL-11: the connected chip disconnects on click, returning to the wallet picker", async ({
  page,
  wallet,
  sonar,
}) => {
  await wallet.install({ info: METAMASK, chainId: SEPOLIA_CHAIN_ID })
  await sonar.login()
  await page.getByRole("button", { name: "Connect MetaMask" }).click()
  await expect(page.getByRole("button", { name: "Place bid" })).toBeVisible()

  await page.getByRole("button", { name: /^Disconnect wallet/ }).click()

  await expect(page.getByText("Connect your wallet.")).toBeVisible()
})

test("WAL-14: a wallet-initiated account switch is picked up live", async ({
  page,
  wallet,
  sonar,
}) => {
  const handler = await wallet.install({ info: METAMASK, chainId: SEPOLIA_CHAIN_ID })
  await sonar.login()
  await page.getByRole("button", { name: "Connect MetaMask" }).click()
  await expect(
    page.getByRole("button", { name: `Disconnect wallet ${short(handler.address)}` }),
  ).toBeVisible()

  const otherAddress = "0x0000000000000000000000000000000000000042"
  await wallet.emit(METAMASK.uuid, "accountsChanged", [otherAddress])

  await expect(
    page.getByRole("button", { name: `Disconnect wallet ${short(otherAddress)}` }),
  ).toBeVisible()
})

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
