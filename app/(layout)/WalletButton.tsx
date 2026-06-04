"use client"

/**
 * In-bar wallet account control, rendered in the expanded sticky bar when a wallet
 * is connected: a truncated-address chip plus a ghost round disconnect button.
 * No popup - disconnect is a direct wagmi `useDisconnect()` call. Renders nothing
 * when disconnected; the `mounted` guard avoids a hydration mismatch while wagmi
 * reconnects on the client.
 */
import { useEffect, useState } from "react"
import { useAccount, useDisconnect } from "wagmi"

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function WalletButton() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (!mounted || !isConnected || !address) return null

  return (
    <button
      type="button"
      onClick={() => disconnect()}
      aria-label={`Disconnect wallet ${truncate(address)}`}
      title="Disconnect"
      className="group inline-flex h-11 items-center gap-2.5 rounded-full border border-border px-4 font-mono text-xs tabular-nums text-foreground transition-colors hover:border-border-strong"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-foreground" />
      {truncate(address)}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-4 w-4 text-muted transition-colors group-hover:text-foreground"
        aria-hidden="true"
      >
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
    </button>
  )
}
