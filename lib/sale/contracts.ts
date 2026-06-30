// Public on-chain addresses for the sale (NOT secrets), keyed by chainId. Sepolia = the Sonar
// sandbox, verified on-chain 2026-06-29 (scripts/probe-sale.mjs). Mainnet is added at launch
// (read paymentTokens() on the prod contract; see REQUIREMENTS A.18).
import { sepolia } from "viem/chains"

type Hex = `0x${string}`

// Only the SettlementSale address is configured (it's the entry point). The payment token address
// + decimals are READ from the contract (paymentTokens()/decimals() in onchain.ts, PaymentTokenDecimals
// from Sonar in limits.ts) so they can never drift from what the deployed contract actually accepts.
export type SaleContracts = {
  settlementSale: Hex
}

const CONTRACTS: Record<number, SaleContracts | undefined> = {
  [sepolia.id]: {
    settlementSale: "0xc600cAF84C3654B572BA84c5bAC3D75c3dA2645A",
  },
  // mainnet (chainId 1): { settlementSale: "0x..." } - TBD at launch.
}

/** Sale contracts for the connected chain, or undefined when none is configured (emulation gate). */
export function saleContractsFor(chainId: number | undefined): SaleContracts | undefined {
  return chainId == null ? undefined : CONTRACTS[chainId]
}
