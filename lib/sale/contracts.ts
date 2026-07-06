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
    // Sonar sandbox contract. A sale redeploy changes this address (and the sale UUID then resolves
    // to the new one), so it is env-overridable to avoid a code change each time - set
    // NEXT_PUBLIC_SEPOLIA_SETTLEMENT_SALE to the Contract Address on Echo's Integration page.
    settlementSale: (process.env.NEXT_PUBLIC_SEPOLIA_SETTLEMENT_SALE ||
      "0x96e532431A8b0e7FCCDF7baFA3BDAc1B20de46B2") as Hex,
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
