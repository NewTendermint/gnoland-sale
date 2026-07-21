"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useState } from "react"
import { WagmiProvider } from "wagmi"
import { WalletTelemetry } from "./WalletTelemetry"
import { wagmiConfig } from "./web3"

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletTelemetry />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
