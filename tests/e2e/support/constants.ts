import { sepolia } from "viem/chains"

// Never 3000/8545: those may already be bound to another dev server on this machine.
export const APP_PORT = 3100
export const RPC_PORT = 8945
export const APP_URL = `http://127.0.0.1:${APP_PORT}`
export const RPC_URL = `http://127.0.0.1:${RPC_PORT}`

export const SEPOLIA_CHAIN_ID = sepolia.id

// Matches lib/sale/contracts.ts's sepolia default (NEXT_PUBLIC_SEPOLIA_SETTLEMENT_SALE is left
// unset for the e2e webServer, so the app resolves this same address).
export const SETTLEMENT_SALE_ADDRESS: `0x${string}` = "0x96e532431A8b0e7FCCDF7baFA3BDAc1B20de46B2"

// Fixture-only ERC-20 address: never deployed, just a key in the RPC stub's dispatch table.
export const MOCK_USDC_ADDRESS: `0x${string}` = "0xc0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0c0"
export const MOCK_USDC_DECIMALS = 6
export const MOCK_USDC_SYMBOL = "USDC"
