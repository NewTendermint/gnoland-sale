"use client"

import { connectFailureBucket, track } from "@/lib/analytics/track"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useConnect } from "wagmi"
import { Icon } from "../../(ui)/Icon"

// Wallet picker behind the funnel's connect gate (./GateSection): which wallets are promoted, their
// logos, and the recommended/others split. RECOMMENDED_WALLETS is a public "supported" claim.

// Wallets we promote in the picker even when the visitor has not installed them (shown greyed with
// an install link). Match against a live connector by wagmi connector id OR EIP-6963 rdns; the
// lowercased-name check is a fallback for rdns values we could not confirm against the running app.
// FOOTGUN: the rdns/id values are best-effort. Confirm one in-app (log
// connector.rdns) and check it end-to-end before adding a wallet here.
type RecommendedWallet = { id: string; name: string; installUrl: string }
const RECOMMENDED_WALLETS: RecommendedWallet[] = [
  { id: "io.metamask", name: "MetaMask", installUrl: "https://metamask.io/download/" },
  {
    id: "coinbaseWalletSDK",
    name: "Coinbase Wallet",
    installUrl: "https://www.coinbase.com/wallet/downloads",
  },
  { id: "io.rabby", name: "Rabby", installUrl: "https://rabby.io/" },
]

const FIND_WALLET_URL = "https://ethereum.org/wallets/find-wallet/"

// Official wallet logos, served locally from public/wallets/. Keyed by wagmi connector id / EIP-6963
// rdns. Installed EIP-6963 wallets already supply their own icon; this map covers the connectors that
// don't (Coinbase SDK, WalletConnect) plus the greyed not-installed recommendations.
const WALLET_ICON_SRC: Record<string, string> = {
  "io.metamask": "/wallets/metamask.svg",
  coinbaseWalletSDK: "/wallets/coinbase.svg",
  "io.rabby": "/wallets/rabby.svg",
  walletConnect: "/wallets/walletconnect.svg",
}

/** Renders the wallet's local SVG, falling back to a generic wallet glyph if it is missing/unknown. */
function WalletIcon({ src, className = "" }: { src?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return <Icon name="wallet" draw={false} className={`h-5 w-5 text-muted ${className}`} />
  }
  return (
    <img
      src={src}
      alt=""
      className={`h-6 w-6 rounded-md ${className}`}
      onError={() => setFailed(true)}
    />
  )
}

// Shape we read off a wagmi connector in the picker. The gallery (/dev/states) passes fixtures of
// this shape via `previewConnectors` so the recommended/others split is reviewable without the
// reviewer having those exact wallets installed.
export type PickerConnector = {
  uid: string
  id: string
  name: string
  icon?: string
  rdns?: string | readonly string[]
}

const matchesRecommended = (c: PickerConnector, rec: RecommendedWallet) => {
  const rdnsList = typeof c.rdns === "string" ? [c.rdns] : (c.rdns ?? [])
  return (
    c.id === rec.id || rdnsList.includes(rec.id) || c.name.toLowerCase() === rec.name.toLowerCase()
  )
}

export function ConnectChoices({
  previewConnectors,
}: { previewConnectors?: PickerConnector[] } = {}) {
  const t = useTranslations("Bid")
  const { connectors, connect, isPending, variables, error } = useConnect()
  // In preview the fixtures stand in for the live connectors; clicks are inert (the fake
  // connectors are not real wagmi connectors, so we never call connect()).
  const isPreview = previewConnectors != null
  const source: readonly PickerConnector[] = previewConnectors ?? connectors
  const pendingUid =
    variables?.connector && "uid" in variables.connector ? variables.connector.uid : undefined
  const seen = new Set<string>()
  const live = source.filter((c) => {
    if (seen.has(c.name)) return false
    seen.add(c.name)
    return true
  })
  // Split the installed wallets into the ones we promote and everything else. Recommended wallets
  // (plus WalletConnect, always a configured connector) sit on the RIGHT under a "Recommended"
  // label - the natural action zone - with the connectable buttons at full strength. Non-promoted
  // discovered wallets (e.g. Keplr, which has a known gas bug on this permit flow, see
  // lib/sale/onchain.ts) fall to the LEFT, dimmed, so nobody reaches for them by default.
  const usedUids = new Set<string>()
  const recommendedLive = live.filter((c) => {
    const hit =
      c.id === "walletConnect" || RECOMMENDED_WALLETS.some((rec) => matchesRecommended(c, rec))
    if (hit) usedUids.add(c.uid)
    return hit
  })
  const otherLive = live.filter((c) => !usedUids.has(c.uid))
  const missing = RECOMMENDED_WALLETS.filter((rec) => !live.some((c) => matchesRecommended(c, rec)))
  const hasRecommended = recommendedLive.length > 0 || missing.length > 0

  const connectButton = (connector: PickerConnector, dimmed: boolean) => {
    const pending = isPending && pendingUid === connector.uid
    return (
      <button
        key={connector.uid}
        type="button"
        onClick={() => {
          if (isPreview) return
          track("wallet_connect_started", { connector: connector.id })
          connect(
            { connector: connector as Parameters<typeof connect>[0]["connector"] },
            {
              // Success is tracked at the provider level (WalletTelemetry): this component
              // unmounts on a successful connect, which would drop a callback attached here.
              // A failed connect leaves it mounted, so onError fires reliably.
              onError: (err) =>
                track("wallet_connect_failed", {
                  connector: connector.id,
                  reason: connectFailureBucket(err),
                }),
            },
          )
        }}
        disabled={isPending && !isPreview}
        aria-label={t("connectNamed", { name: connector.name })}
        title={connector.name}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-alt transition-all hover:border-faint ${
          dimmed ? "opacity-50 hover:opacity-100 focus-visible:opacity-100" : ""
        } ${pending ? "animate-pulse" : isPending && !isPreview ? "opacity-40" : ""}`}
      >
        {connector.icon ? (
          <img src={connector.icon} alt="" className="h-6 w-6 rounded-md" />
        ) : (
          <WalletIcon src={WALLET_ICON_SRC[connector.id]} />
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex items-center gap-3">
        <Icon name="wallet" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
        <p className="text-sm">
          <span className="font-medium text-foreground">{t("connectWallet")}</span>
          <span className={`ml-1.5 ${error ? "text-danger" : "text-muted"}`}>
            {error ? t("connectionFailed") : t("connectPrompt")}
          </span>
        </p>
      </div>
      <div className="ml-auto flex flex-wrap items-end justify-end gap-x-3 gap-y-2">
        {/* Secondary zone (left): find-a-wallet + non-promoted discovered wallets, dimmed. */}
        <div className="flex items-center gap-2 self-end">
          <a
            href={FIND_WALLET_URL}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => track("wallet_install_clicked", { wallet: "find-a-wallet" })}
            aria-label={t("findWalletAria")}
            title={t("findWalletTitle")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-faint bg-surface-alt opacity-60 transition-all hover:opacity-100 focus-visible:opacity-100"
          >
            <Icon name="search" draw={false} className="h-5 w-5 text-muted" />
          </a>
          {otherLive.map((connector) => connectButton(connector, true))}
        </div>
        {/* Thin divider so the demoted wallets read as a separate group, never blending into the
            recommended ones in the middle of the row. */}
        {hasRecommended ? (
          <div aria-hidden="true" className="mb-1.5 h-8 w-px self-end bg-border" />
        ) : null}
        {/* Promoted zone (right, action zone): recommended wallets under a small label. Not-installed
            recommendations show first as dashed install links, then the connectable ones at full
            strength, so a real connect button sits at the far right. */}
        {hasRecommended ? (
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
              {t("recommendedLabel")}
            </span>
            <div className="flex items-center gap-2">
              {missing.map((rec) => (
                <a
                  key={rec.id}
                  href={rec.installUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => track("wallet_install_clicked", { wallet: rec.name })}
                  aria-label={t("getWalletAria", { name: rec.name })}
                  title={t("getWalletTitle", { name: rec.name })}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-faint bg-surface-alt opacity-70 transition-all hover:opacity-100 focus-visible:opacity-100"
                >
                  <WalletIcon src={WALLET_ICON_SRC[rec.id]} className="grayscale" />
                </a>
              ))}
              {recommendedLive.map((connector) => connectButton(connector, false))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
