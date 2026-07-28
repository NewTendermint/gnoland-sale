// Per-chain RPC failover order, shared by the wagmi client (web3.ts) and the
// server read client (server-client.ts): keyed RPC (env) -> publicnode ->
// undefined = the chain's default transport. One list, so every reader moves together.
// Every host here must stay allowlisted in the CSP connect-src (middleware.ts).
import { mainnet, sepolia } from "viem/chains"

export function rpcUrlsFor(chainId: number): string[] {
  if (chainId === mainnet.id) {
    return [
      ...(process.env.NEXT_PUBLIC_MAINNET_RPC_URL ? [process.env.NEXT_PUBLIC_MAINNET_RPC_URL] : []),
      "https://ethereum-rpc.publicnode.com",
    ]
  }
  if (chainId === sepolia.id) {
    return [
      ...(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ? [process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL] : []),
      "https://ethereum-sepolia-rpc.publicnode.com",
    ]
  }
  return []
}
