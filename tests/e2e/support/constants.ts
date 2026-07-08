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

// Well-known Anvil/Foundry dev accounts #0 and #1 - public test fixtures published in Foundry's
// docs, never real secrets. Used as the mock wallets' signing keys (real EIP-2612 signatures, no
// real funds or deployment behind them). Two keys because the server's per-wallet permit replay
// guard (checkPermitDedup, 5s window) refuses back-to-back permits for one wallet - each bid
// spec needs its own wallet.
export const TEST_ACCOUNT_PRIVATE_KEY: `0x${string}` =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
export const SECOND_ACCOUNT_PRIVATE_KEY: `0x${string}` =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
