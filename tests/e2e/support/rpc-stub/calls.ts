import { SALE_STAGE, erc20Abi, settlementSaleAbi } from "@/lib/sale/abi"
// eth_call dispatch for the sale's two contracts, decoded/encoded with the app's own ABIs
// (lib/sale/abi.ts) so a contract-interface drift fails the suite loudly instead of the stub
// quietly answering the wrong shape.
import type { Hex } from "viem"
import { decodeFunctionData, encodeFunctionResult, multicall3Abi } from "viem"
import {
  MOCK_USDC_ADDRESS,
  MOCK_USDC_DECIMALS,
  MOCK_USDC_SYMBOL,
  SETTLEMENT_SALE_ADDRESS,
} from "../constants"

function callSettlementSale(data: Hex): Hex {
  const abi = settlementSaleAbi
  const decoded = decodeFunctionData({ abi, data })
  switch (decoded.functionName) {
    case "paymentTokens":
      return encodeFunctionResult({
        abi,
        functionName: "paymentTokens",
        result: [MOCK_USDC_ADDRESS],
      })
    case "stage":
      return encodeFunctionResult({ abi, functionName: "stage", result: SALE_STAGE.commitment })
    case "claimRefundEnabled":
      return encodeFunctionResult({ abi, functionName: "claimRefundEnabled", result: false })
    case "entityStatesByIDs": {
      const [entityIDs] = decoded.args
      const result = entityIDs.map((entityID) => ({
        entityID,
        bidTimestamp: 0,
        refunded: false,
        currentBid: { lockup: false, price: 0n, amount: 0n },
        walletStates: [],
      }))
      return encodeFunctionResult({ abi, functionName: "entityStatesByIDs", result })
    }
    // No outputs: a non-reverting eth_call (empty "0x") is exactly what simulateContract needs
    // to let the real wallet prompt (eth_sendTransaction) happen.
    case "replaceBidWithPermit":
      return encodeFunctionResult({ abi, functionName: "replaceBidWithPermit", result: undefined })
    case "replaceBidWithApproval":
      return encodeFunctionResult({
        abi,
        functionName: "replaceBidWithApproval",
        result: undefined,
      })
    case "walletStatesByAddresses":
      throw new Error(
        "rpc-stub: walletStatesByAddresses is not modeled (claim flow is out of scope)",
      )
    default:
      throw new Error(`rpc-stub: unhandled settlementSale call "${decoded.functionName}"`)
  }
}

function callMockUsdc(data: Hex): Hex {
  const abi = erc20Abi
  const decoded = decodeFunctionData({ abi, data })
  const { functionName } = decoded
  switch (functionName) {
    case "name":
      return encodeFunctionResult({ abi, functionName: "name", result: "USD Coin" })
    case "version":
      return encodeFunctionResult({ abi, functionName: "version", result: "2" })
    case "symbol":
      return encodeFunctionResult({ abi, functionName: "symbol", result: MOCK_USDC_SYMBOL })
    case "decimals":
      return encodeFunctionResult({ abi, functionName: "decimals", result: MOCK_USDC_DECIMALS })
    case "nonces":
      return encodeFunctionResult({ abi, functionName: "nonces", result: 0n })
    case "balanceOf":
      // 1,000,000 USDC @ 6 decimals - comfortably above any bid amount the specs place.
      return encodeFunctionResult({ abi, functionName: "balanceOf", result: 1_000_000_000_000n })
    case "allowance":
      return encodeFunctionResult({ abi, functionName: "allowance", result: 0n })
    case "approve":
      return encodeFunctionResult({ abi, functionName: "approve", result: true })
    default:
      throw new Error(`rpc-stub: unhandled ERC-20 call "${functionName}"`)
  }
}

// Canonical Multicall3 deployment address: viem/wagmi batch eth_calls through it by default,
// so the stub must unwrap aggregate3 and answer each sub-call - otherwise every batched read
// errors and the app's fallback transport silently retries it against the REAL public RPC.
const MULTICALL3_ADDRESS = "0xca11bde05977b3631167028862be2a173976ca11"

function callMulticall3(data: Hex): Hex {
  const decoded = decodeFunctionData({ abi: multicall3Abi, data })
  if (decoded.functionName !== "aggregate3") {
    throw new Error(`rpc-stub: unhandled multicall3 call "${decoded.functionName}"`)
  }
  const [calls] = decoded.args
  const result: { success: boolean; returnData: Hex }[] = calls.map(
    ({ target, callData, allowFailure }) => {
      try {
        return { success: true, returnData: computeEthCall(target, callData) }
      } catch (err) {
        if (!allowFailure) throw err
        return { success: false, returnData: "0x" }
      }
    },
  )
  return encodeFunctionResult({ abi: multicall3Abi, functionName: "aggregate3", result })
}

/** Answers a JSON-RPC eth_call for the settlement sale, the mock USDC token, or a multicall3
 *  batch wrapping them. */
export function computeEthCall(to: Hex, data: Hex): Hex {
  const addr = to.toLowerCase()
  if (addr === SETTLEMENT_SALE_ADDRESS.toLowerCase()) return callSettlementSale(data)
  if (addr === MOCK_USDC_ADDRESS.toLowerCase()) return callMockUsdc(data)
  if (addr === MULTICALL3_ADDRESS) return callMulticall3(data)
  throw new Error(`rpc-stub: eth_call to unknown address ${to}`)
}
