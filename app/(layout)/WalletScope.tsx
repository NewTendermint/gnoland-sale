"use client"

/**
 * Lazily-mounted wallet scope. BidPanel loads this (next/dynamic, ssr:false) only
 * when the bid panel opens, so wagmi + WalletConnect stay out of the initial page
 * bundle. Mounts the wagmi provider stack and pushes the real wallet-derived journey
 * up to SaleProvider (setWalletJourney) so the whole bar reflects it.
 */
import { useEffect } from "react"
import type { ReactNode } from "react"
import { useAccount } from "wagmi"
import type { JourneyState } from "../../lib/sale/types"
import { useSale } from "./SaleProvider"
import { Web3Provider } from "./Web3Provider"
import { SUPPORTED_CHAIN_IDS } from "./web3"

/** Reads real wagmi state and pushes the connect/network journey up to SaleProvider. */
function WalletJourneySync() {
  const { isConnected, chainId } = useAccount()
  const { setWalletJourney } = useSale()
  useEffect(() => {
    const onSupportedChain = chainId !== undefined && SUPPORTED_CHAIN_IDS.includes(chainId)
    const journey: JourneyState = !isConnected
      ? "disconnected"
      : onSupportedChain
        ? "kyc-required"
        : "wrong-network"
    setWalletJourney(journey)
  }, [isConnected, chainId, setWalletJourney])
  return null
}

export function WalletScope({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      <WalletJourneySync />
      {children}
    </Web3Provider>
  )
}
