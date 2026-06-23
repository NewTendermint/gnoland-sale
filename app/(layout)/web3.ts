// wagmi config. Chains pinned to Ethereum mainnet + Sepolia only; never add others (project rule).
import { mainnet, sepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { coinbaseWallet, walletConnect } from "wagmi/connectors"

export const SUPPORTED_CHAIN_IDS: readonly number[] = [mainnet.id, sepolia.id]

export const PRIMARY_CHAIN_ID = mainnet.id

// Coinbase Wallet SDK + EIP-6963 browser-extension wallets (MetaMask, Keplr...) auto-discovered.
// WalletConnect (mobile/hardware wallets via QR) is always on, so it shows as a ready button in
// ConnectChoices like the others. The projectId is a PUBLIC client id (not a secret) from Reown/
// WalletConnect Cloud; usage is locked to our domains via the Reown AllowList, not by hiding the id.
// Override per-environment with NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.
const wcProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "3100363ec0c44be58cfdbe63ca50187f"

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    coinbaseWallet({ appName: "GNOT Public Sale" }),
    walletConnect({ projectId: wcProjectId, showQrModal: true }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
})
