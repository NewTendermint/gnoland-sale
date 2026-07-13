"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useAccount, useDisconnect } from "wagmi"
import { PowerGlyph } from "../(sections)/bid/ManageEntity"
import { Icon } from "../(ui)/Icon"

function truncate(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function WalletButton() {
  const t = useTranslations("Wallet")
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  if (!mounted || !isConnected || !address) return null

  return (
    <button
      type="button"
      onClick={() => disconnect()}
      aria-label={t("disconnectWalletAria", { address: truncate(address) })}
      title={t("disconnect")}
      className="group inline-flex h-8 items-center gap-2 rounded-full border border-border px-3 font-mono text-[11px] tabular-nums text-foreground transition-colors hover:border-border-strong"
    >
      <Icon name="wallet" draw={false} className="h-3.5 w-3.5 shrink-0" />
      {truncate(address)}
      <PowerGlyph className="h-3.5 w-3.5 text-muted transition-colors group-hover:text-foreground" />
    </button>
  )
}
