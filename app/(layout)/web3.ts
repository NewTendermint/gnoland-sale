// wagmi config. Chains pinned to Ethereum mainnet + Sepolia only; never add others (project rule).
import { mainnet, sepolia } from "viem/chains"
import { http, createConfig, fallback } from "wagmi"
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
    // Failover order per chain: dedicated keyed RPC (env, provision before launch) -> publicnode
    // (free, per-visitor-IP limits) -> viem's chain default. Every host here must stay allowlisted
    // in the CSP connect-src (middleware.ts).
    [mainnet.id]: fallback([
      ...(process.env.NEXT_PUBLIC_MAINNET_RPC_URL
        ? [http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL)]
        : []),
      http("https://ethereum-rpc.publicnode.com"),
      http(),
    ]),
    [sepolia.id]: fallback([
      ...(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
        ? [http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL)]
        : []),
      http("https://ethereum-sepolia-rpc.publicnode.com"),
      http(),
    ]),
  },
  ssr: true,
})
