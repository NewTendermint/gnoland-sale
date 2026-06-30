// Public on-chain addresses for the sale (NOT secrets), keyed by chainId. Sepolia = the Sonar
// sandbox; mainnet is added at launch (read paymentTokens() on the prod contract).
import { mainnet, sepolia } from "viem/chains"

type Hex = `0x${string}`

// Only the SettlementSale address is configured (the entry point). The payment token address +
// decimals are READ from the contract, never hardcoded, so they can't drift from what it accepts.
export type SaleContracts = {
  settlementSale: Hex
}

const CONTRACTS: Record<number, SaleContracts | undefined> = {
  [sepolia.id]: {
    settlementSale: "0xc600cAF84C3654B572BA84c5bAC3D75c3dA2645A",
  },
  // mainnet (chainId 1): { settlementSale: "0x..." } - TBD at launch.
}

/** Sale contracts for the connected chain, or undefined when no contract is deployed there. */
export function saleContractsFor(chainId: number | undefined): SaleContracts | undefined {
  return chainId == null ? undefined : CONTRACTS[chainId]
}

// Default = prod mainnet; NEXT_PUBLIC_SALE_CHAIN overrides for staging/local (sepolia).
const SALE_CHAINS_BY_NAME = { mainnet, sepolia } as const
export const SALE_CHAIN =
  SALE_CHAINS_BY_NAME[process.env.NEXT_PUBLIC_SALE_CHAIN as keyof typeof SALE_CHAINS_BY_NAME] ??
  mainnet
