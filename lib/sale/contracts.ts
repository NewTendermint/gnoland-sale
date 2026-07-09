// Public on-chain addresses for the sale (NOT secrets), keyed by chainId. Sepolia = the Sonar
// sandbox; mainnet = the prod sale contract.
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
  [mainnet.id]: {
    // Prod SettlementSale. Deliberately NOT env-overridable: a prod address change must be a
    // reviewed code change.
    settlementSale: "0x959f2ceE7B6C2095d228692eCb2E4744f2D3fDb4",
  },
}

/** Sale contracts for the connected chain, or undefined when no contract is deployed there. */
export function saleContractsFor(chainId: number | undefined): SaleContracts | undefined {
  return chainId == null ? undefined : CONTRACTS[chainId]
}

// Fail-safe default = sepolia, matching the server default (z.enum in env.ts): an unset
// NEXT_PUBLIC_SALE_CHAIN must NEVER silently target mainnet. Prod REQUIRES the pair
// SALE_CHAIN + NEXT_PUBLIC_SALE_CHAIN = "mainnet" set explicitly in its deploy context.
// Any OTHER value throws at module scope = the build fails: a typo must never pick a
// chain silently while the server resolves a different one.
const SALE_CHAINS_BY_NAME = { mainnet, sepolia } as const
const SALE_CHAIN_NAME = process.env.NEXT_PUBLIC_SALE_CHAIN
if (SALE_CHAIN_NAME && !Object.hasOwn(SALE_CHAINS_BY_NAME, SALE_CHAIN_NAME)) {
  throw new Error(
    `NEXT_PUBLIC_SALE_CHAIN: unknown chain "${SALE_CHAIN_NAME}" (expected "mainnet" or "sepolia")`,
  )
}
export const SALE_CHAIN =
  SALE_CHAINS_BY_NAME[SALE_CHAIN_NAME as keyof typeof SALE_CHAINS_BY_NAME] ?? sepolia
