// wagmi config. Chains pinned to Ethereum mainnet + Sepolia only; never add others (project rule).
import { mainnet, sepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { coinbaseWallet, walletConnect } from "wagmi/connectors"

// The projectId is a PUBLIC client id (not a secret) from Reown/WalletConnect Cloud; usage is
// locked to our domains via the Reown AllowList, not by hiding the id.
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
    // Dedicated RPC per chain (Alchemy/Infura...) when set, else viem's public default (rate-limited,
    // not launch-grade). When you set one, add its host to the CSP connect-src in middleware.ts.
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || undefined),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || undefined),
  },
  ssr: true,
})
