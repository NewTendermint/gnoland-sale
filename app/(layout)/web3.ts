// wagmi config. Chains pinned to Ethereum mainnet + Sepolia only; never add others (project rule).
import { mainnet, sepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { coinbaseWallet, walletConnect } from "wagmi/connectors"

export const SUPPORTED_CHAIN_IDS: readonly number[] = [mainnet.id, sepolia.id]

export const PRIMARY_CHAIN_ID = mainnet.id

// Coinbase Wallet SDK + EIP-6963 browser-extension wallets (MetaMask, Keplr...) auto-discovered.
// WalletConnect (mobile wallets via QR) is wired but DORMANT until NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
// is set; once set it appears automatically in ConnectChoices (no extra UI code).
const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    coinbaseWallet({ appName: "GNOT Public Sale" }),
    ...(wcProjectId ? [walletConnect({ projectId: wcProjectId, showQrModal: true })] : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
})
