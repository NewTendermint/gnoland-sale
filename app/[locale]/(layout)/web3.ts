import { rpcUrlsFor } from "@/lib/sale/rpc"
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
    // Failover order per chain lives in lib/sale/rpc.ts (shared with the server-side readers);
    // the trailing http() is viem's chain default.
    [mainnet.id]: fallback([...rpcUrlsFor(mainnet.id).map((url) => http(url)), http()]),
    [sepolia.id]: fallback([...rpcUrlsFor(sepolia.id).map((url) => http(url)), http()]),
  },
  ssr: true,
})
