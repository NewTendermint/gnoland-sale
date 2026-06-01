/**
 * wagmi configuration for wallet connection. No wallet-UI library: the connect
 * picker, connected address, and disconnect all render inline in the sticky bar
 * via wagmi's headless hooks.
 *
 * Chain pinning is LOCKED: Base mainnet (prod) + Base Sepolia (preview) only.
 * Never add other chains (project rule).
 *
 * Connectors: Coinbase Wallet + WalletConnect, plus browser-extension wallets
 * (MetaMask, Keplr, Brave, ...) auto-discovered via EIP-6963 - they bring their own
 * name + logo. WalletConnect keeps `showQrModal: true`, so mobile wallets connect
 * through WC's own QR modal (the single intentional popup); extension wallets connect
 * with no app-level popup.
 */
import { base, baseSepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { coinbaseWallet, walletConnect } from "wagmi/connectors"

export const SUPPORTED_CHAIN_IDS: readonly number[] = [base.id, baseSepolia.id]

// Chain the wrong-network gate switches to. Base mainnet in prod; preview can override.
export const PRIMARY_CHAIN_ID = base.id

// WalletConnect projectId is required. Placeholder until the real id is provisioned
// (external blocker). Extension wallets work without it; only WalletConnect needs it.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "GNOT_ICO_DEV_PLACEHOLDER"

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({ appName: "GNOT Public Sale" }),
    walletConnect({ projectId, showQrModal: true }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
})
