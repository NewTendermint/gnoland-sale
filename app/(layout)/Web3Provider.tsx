"use client"

/**
 * Client provider stack for wallet connection: WagmiProvider (config in ./web3)
 * + react-query (wagmi's data layer). No wallet-UI library - the connect picker,
 * connected address, and disconnect all render inline in the sticky bar via
 * wagmi's headless hooks. Mounted in the root layout inside ThemeProvider.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useState } from "react"
import { WagmiProvider } from "wagmi"
import { wagmiConfig } from "./web3"

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
