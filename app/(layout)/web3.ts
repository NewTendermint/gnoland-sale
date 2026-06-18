// wagmi config. Chains pinned to Ethereum mainnet + Sepolia only; never add others (project rule).
import { mainnet, sepolia } from "viem/chains"
import { http, createConfig } from "wagmi"
import { coinbaseWallet, walletConnect } from "wagmi/connectors"

export const SUPPORTED_CHAIN_IDS: readonly number[] = [mainnet.id, sepolia.id]

export const PRIMARY_CHAIN_ID = mainnet.id

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
