import { settlementSaleAbi } from "@/lib/sale/abi"
// WAL-19 (our side, per the honest-scope note in .mynote/wallet-testing-research-2026-07-07.md):
// this machine-verifies the request SHAPE our app sends a wallet for a bid - the EIP-2612 permit
// typed data and the replaceBidWithPermit calldata - not a real receipt. The wallet then rejects
// eth_sendTransaction (MockWalletHandler's default), so the flow always terminates in the
// deterministic "You cancelled the transaction." UI state (lib/sale/onchain.ts's
// sharedWalletErrorReason).
import { decodeFunctionData } from "viem"
import { expect, test } from "../fixtures"
import { openBidPanel } from "../support/bid-panel"
import {
  MOCK_USDC_ADDRESS,
  PERMIT_FIXTURE_WALLET,
  SEPOLIA_CHAIN_ID,
  SETTLEMENT_SALE_ADDRESS,
} from "../support/constants"

const ICON = "data:image/svg+xml;base64,PHN2Zy8+"
const METAMASK = {
  uuid: "66666666-0000-0000-0000-000000000001",
  name: "MetaMask",
  icon: ICON,
  rdns: "io.metamask",
}

async function connectAndOpenBidForm(page: Parameters<typeof openBidPanel>[0]): Promise<void> {
  await page.reload()
  await openBidPanel(page)
  await page.getByRole("button", { name: "Connect MetaMask" }).click()
  await expect(page.getByRole("button", { name: "Place bid" })).toBeVisible()
}

test.beforeEach(async ({ sonar }) => {
  await sonar.login()
})

test("WAL-19: placing a bid sends a correctly-shaped EIP-2612 permit and replaceBidWithPermit calldata, then a rejected transaction shows a deterministic cancel", async ({
  page,
  wallet,
}) => {
  const handler = await wallet.install({ info: METAMASK, chainId: SEPOLIA_CHAIN_ID })
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
  expect(permit?.message.owner).toBe(handler.address)
  expect(permit?.message.spender).toBe(SETTLEMENT_SALE_ADDRESS)

  // --- replaceBidWithPermit calldata assertion (decoded with the app's own ABI) ---
  const sendTransactionRequests = handler.sendTransactionRequests()
  expect(sendTransactionRequests).toHaveLength(1)
  const tx = sendTransactionRequests[0]
  expect(tx).toBeDefined()
  expect(tx?.to.toLowerCase()).toBe(SETTLEMENT_SALE_ADDRESS.toLowerCase())
  const decoded = decodeFunctionData({ abi: settlementSaleAbi, data: tx?.data ?? "0x" })
  expect(decoded.functionName).toBe("replaceBidWithPermit")
  if (decoded.functionName !== "replaceBidWithPermit") throw new Error("unreachable")
  const [token, , purchasePermit, signature] = decoded.args
  expect(token).toBe(MOCK_USDC_ADDRESS)
  // The mock permit fixture's wallet, NOT the connected account (lib/sonar/mock-fixtures.ts).
  expect(purchasePermit.wallet).toBe(PERMIT_FIXTURE_WALLET)
  // Signature round-trip: the calldata forwards exactly the signature the wallet produced.
  expect(signature).toBe(permit?.signature)
})

test("WAL-19 reject variant: rejecting the EIP-2612 permit signature shows the signature-cancel copy", async ({
  page,
  wallet,
}) => {
  await wallet.install({
    info: METAMASK,
    chainId: SEPOLIA_CHAIN_ID,
    signTypedDataBehavior: "reject",
  })
  await connectAndOpenBidForm(page)

  await page.getByRole("textbox", { name: "Amount (USD)" }).fill("150")
  await page.getByRole("button", { name: "Place bid" }).click()
  await page.getByRole("button", { name: "Confirm bid" }).click()

  await expect(page.getByText("You cancelled the signature.")).toBeVisible()
})
