"use client"

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
      className="group inline-flex h-8 items-center gap-2 rounded-full border border-border px-3 font-mono text-[11px] tabular-nums text-foreground transition-colors hover:border-border-strong"
    >
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-foreground" />
      {truncate(address)}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-3.5 w-3.5 text-muted transition-colors group-hover:text-foreground"
        aria-hidden="true"
      >
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
    </button>
  )
}
