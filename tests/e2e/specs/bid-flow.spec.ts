import { settlementSaleAbi } from "@/lib/sale/abi"
// WAL-19 (our side, per the honest-scope note in .mynote/wallet-testing-research-2026-07-07.md):
// this machine-verifies the request SHAPE our app sends a wallet for a bid - the EIP-2612 permit
// typed data and the replaceBidWithPermit calldata - not a real receipt. The wallet then rejects
// eth_sendTransaction (MockWalletHandler's default), so the flow always terminates in the
// deterministic "You cancelled the transaction." UI state (lib/sale/onchain.ts's
// sharedWalletErrorReason).
import type { Page } from "@playwright/test"
import { decodeFunctionData } from "viem"
import { expect, test } from "../fixtures"
import { MOCK_USDC_ADDRESS, SEPOLIA_CHAIN_ID, SETTLEMENT_SALE_ADDRESS } from "../support/constants"

const ICON = "data:image/svg+xml;base64,PHN2Zy8+"
const METAMASK = {
  uuid: "66666666-0000-0000-0000-000000000001",
  name: "MetaMask",
  icon: ICON,
  rdns: "io.metamask",
}

// Wallets install BEFORE sonar.login(): the login's navigation runs the init script and lands on
// /?auth=ok, which auto-opens the bid panel (see wallet-picker.spec.ts for the rationale).
async function connectAndOpenBidForm(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Connect MetaMask" }).click()
  await expect(page.getByRole("button", { name: "Place bid" })).toBeVisible()
}

test("WAL-19: placing a bid sends a correctly-shaped EIP-2612 permit and replaceBidWithPermit calldata, then a rejected transaction shows a deterministic cancel", async ({
  page,
  wallet,
  sonar,
}) => {
  const handler = await wallet.install({ info: METAMASK, chainId: SEPOLIA_CHAIN_ID })
  await sonar.login()
  await connectAndOpenBidForm(page)

  await page.getByRole("textbox", { name: "Amount (USD)" }).fill("150")
  await page.getByRole("button", { name: "Place bid" }).click()
  await page.getByRole("button", { name: "Confirm bid" }).click()

  await expect(page.getByText("You cancelled the transaction.")).toBeVisible()

  // --- EIP-2612 permit typed-data assertion ---
  const typedDataRequests = handler.typedDataRequests()
  expect(typedDataRequests).toHaveLength(1)
  const permit = typedDataRequests[0]
  expect(permit).toBeDefined()
  expect(permit?.primaryType).toBe("Permit")
  expect(permit?.domain.verifyingContract).toBe(MOCK_USDC_ADDRESS)
  expect(permit?.domain.chainId).toBe(SEPOLIA_CHAIN_ID)
  // Address fields compare case-insensitively: the app lowercases wallets on parse while viem
  // checksums decoded values, and EIP-55 casing carries no semantic difference.
  expect(String(permit?.message.owner).toLowerCase()).toBe(handler.address.toLowerCase())
  expect(String(permit?.message.spender).toLowerCase()).toBe(SETTLEMENT_SALE_ADDRESS.toLowerCase())

  // --- replaceBidWithPermit calldata assertion (decoded with the app's own ABI) ---
  const sendTransactionRequests = handler.sendTransactionRequests()
  expect(sendTransactionRequests).toHaveLength(1)
  const tx = sendTransactionRequests[0]
  expect(tx).toBeDefined()
  expect(tx?.to.toLowerCase()).toBe(SETTLEMENT_SALE_ADDRESS.toLowerCase())
  const decoded = decodeFunctionData({ abi: settlementSaleAbi, data: tx?.data ?? "0x" })
  expect(decoded.functionName).toBe("replaceBidWithPermit")
  if (decoded.functionName !== "replaceBidWithPermit") throw new Error("unreachable")
  const [token, , purchasePermit, purchasePermitSignature, , erc20PermitSignature] = decoded.args
  expect(token.toLowerCase()).toBe(MOCK_USDC_ADDRESS.toLowerCase())
  // The permit binds the connected account (mock-fetch stamps the requested wallet in, like real
  // Sonar; the preflight refuses a foreign-wallet permit).
  expect(purchasePermit.wallet.toLowerCase()).toBe(handler.address.toLowerCase())
  // Signature round-trips: the Sonar permit signature is forwarded verbatim from the mock
  // fixture, and the ERC-2612 signature is exactly what the wallet produced.
  expect(purchasePermitSignature).toBe(`0x${"ab".repeat(32)}`)
  expect(erc20PermitSignature).toBe(permit?.signature)
})

test("WAL-19 reject variant: rejecting the EIP-2612 permit signature shows the signature-cancel copy", async ({
  page,
  wallet,
  sonar,
}) => {
  await wallet.install({
    info: METAMASK,
    chainId: SEPOLIA_CHAIN_ID,
    signTypedDataBehavior: "reject",
  })
  await sonar.login()
  await connectAndOpenBidForm(page)

  await page.getByRole("textbox", { name: "Amount (USD)" }).fill("150")
  await page.getByRole("button", { name: "Place bid" }).click()
  await page.getByRole("button", { name: "Confirm bid" }).click()

  await expect(page.getByText("You cancelled the signature.")).toBeVisible()
})
