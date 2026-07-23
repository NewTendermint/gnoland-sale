"use client"

import { useViewFocus } from "@/lib/a11y/focus"
import { bidAmountBucket, bidFailureCode, connectFailureBucket, track } from "@/lib/analytics/track"
import { clearEmailOptInDone, emailOptInDone, newsletterEnabled } from "@/lib/newsletter/config"
import {
  balanceCoversBid,
  bidHeadroomPct,
  gnotEstimate,
  snapBidPrice,
  validateBidAmount,
  validateBidPrice,
} from "@/lib/sale/calc"
import { SALE_CHAIN } from "@/lib/sale/contracts"
import { SALE_ECONOMICS } from "@/lib/sale/economics"
import { fmtCompact, fmtGnot, fmtPrice, fmtUsd, parseDecimal } from "@/lib/sale/format"
import { type BidPrecheck, usePaymentTokens, useTokenBalance } from "@/lib/sale/hooks"
import {
  type SaleTranslator,
  punctuate,
  supportMailtoHref,
  supportVerifyFailedHref,
  verifyIncomplete,
  verifyStatus,
  welcomeBack,
} from "@/lib/sale/labels"
import { defaultPaymentToken } from "@/lib/sale/onchain"
import {
  type BidParams,
  type BidResult,
  type BidStage,
  MockBidSubmitter,
} from "@/lib/sale/submitter"
import type { JourneyState, MyBid } from "@/lib/sale/types"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { sepolia } from "viem/chains"
import { useAccount, useChainId, useConnect, useSwitchChain } from "wagmi"
import { NewsletterForm } from "../../(layout)/NewsletterForm"
import { CloseButton } from "../../(ui)/CloseButton"
import { Cta } from "../../(ui)/Cta"
import { Icon } from "../../(ui)/Icon"
import { TierBonusPill } from "./BonusNote"
import { ManageEntityCta, SonarSignOutButton } from "./ManageEntity"
import { usePushAlerts } from "./PushOptIn"

const submitter = new MockBidSubmitter()

// Wallets we promote in the picker even when the visitor has not installed them (shown greyed with
// an install link). Match against a live connector by wagmi connector id OR EIP-6963 rdns; the
// lowercased-name check is a fallback for rdns values we could not confirm against the running app.
// FOOTGUN: the rdns/id values are best-effort - confirm them in-app (log connector.rdns) and verify
// each wallet end-to-end on the real bid flow before launch; this list IS a public "supported" claim.
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

// Channel pitches (validated copy) live in the Bid namespace: the compact menu is CTAs only, each
// dedicated view shows its own channel pitch (the CTA label already names the channel, so the
// email pitch carries only the privacy promise). pushHint is the settings tooltip for granted.

/** Post-bid opt-in row. Compact menu: one explainer + two icon CTAs (check icon once a channel
 *  is active). Clicking a CTA switches the slot to that channel's dedicated view; success and
 *  error copy lives ONLY in the dedicated views. Exported for the /dev/states gallery. */
export function PostBidOptIns({
  bidLimitUsd,
  onDetailChange,
}: {
  bidLimitUsd: number
  /** Fires when the slot enters/leaves a dedicated view, so the row can free horizontal space. */
  onDetailChange?: (detail: boolean) => void
}) {
  const t = useTranslations("Bid")
  const { supported, status, enable } = usePushAlerts(bidLimitUsd)
  const [view, setViewRaw] = useState<"menu" | "email" | "push">("menu")
  const setView = (v: "menu" | "email" | "push") => {
    setViewRaw(v)
    onDetailChange?.(v !== "menu")
  }
  const [emailDone, setEmailDone] = useState(false)
  const emailEnabled = newsletterEnabled()

  // The flag is written by ANY NewsletterForm instance (footer, tiles, this panel).
  useEffect(() => {
    setEmailDone(emailOptInDone())
  }, [])

  const pushGranted = status === "granted"
  const pushOffered = supported && status !== "unsupported"

  if (view === "email") {
    return (
      <div className="ml-auto flex min-w-0 items-center justify-end gap-x-4">
        <div aria-hidden="true" className="h-8 w-px shrink-0 bg-border" />
        {emailDone ? (
          // Re-opened from the checked CTA: the subscription already happened, show the state,
          // with an escape hatch for a mistyped address (clears the browser flag only).
          <>
            <p className="flex items-center gap-2 whitespace-nowrap text-xs text-mint">
              <Icon name="shield-check" draw={false} className="h-4 w-4 shrink-0" />
              {t("confirmationSent")}
            </p>
            <button
              type="button"
              onClick={() => {
                clearEmailOptInDone()
                setEmailDone(false)
              }}
              className="cursor-pointer whitespace-nowrap text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              {t("useAnotherEmail")}
            </button>
          </>
        ) : (
          <>
            <p className="min-w-0 max-w-[36ch] shrink text-right text-xs text-muted">
              {t("emailPitch")}
            </p>
            <span className="shrink-0">
              <NewsletterForm
                variant="inline"
                inputId="bid-panel-email"
                onSuccess={() => setEmailDone(true)}
              />
            </span>
          </>
        )}
        <CloseButton label={t("backToNotifications")} onClick={() => setView("menu")} />
      </div>
    )
  }

  if (view === "push") {
    return (
      <div className="ml-auto flex min-w-0 items-center justify-end gap-x-4">
        <div aria-hidden="true" className="h-8 w-px shrink-0 bg-border" />
        {status === "working" ? (
          <p className="min-w-0 max-w-[36ch] shrink text-right text-xs text-muted">
            {t("pushPitch")}
          </p>
        ) : status === "error" ? (
          <p className="min-w-0 max-w-[44ch] shrink text-right text-xs text-muted">
            {t("pushError")}
          </p>
        ) : null}
        {status === "working" ? (
          <Cta variant="ghost-contrast" size="sm" className="shrink-0 whitespace-nowrap" disabled>
            {t("enabling")}
          </Cta>
        ) : status === "granted" ? (
          <p
            className="flex items-center gap-2 whitespace-nowrap text-xs text-mint"
            title={t("pushHint")}
          >
            <Icon name="shield-check" draw={false} className="h-4 w-4 shrink-0" />
            {t("pushGranted")}
          </p>
        ) : status === "denied" ? (
          <p className="text-xs text-muted">{t("pushDenied")}</p>
        ) : status === "unsupported" ? (
          <p className="text-xs text-muted">{t("pushUnsupported")}</p>
        ) : (
          <Cta
            variant="ghost-contrast"
            size="sm"
            className="shrink-0 whitespace-nowrap"
            onClick={enable}
          >
            {t("retry")}
          </Cta>
        )}
        {status !== "working" ? (
          <CloseButton label={t("backToNotifications")} onClick={() => setView("menu")} />
        ) : null}
      </div>
    )
  }

  return (
    <div className="ml-auto flex min-w-0 items-center justify-end gap-x-3">
      {emailEnabled ? (
        <Cta
          variant="ghost-contrast"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          onClick={() => setView("email")}
        >
          <Icon
            name={emailDone ? "shield-check" : "send"}
            draw={false}
            className={`h-4 w-4 shrink-0 ${emailDone ? "text-mint" : ""}`}
          />
          {emailDone ? t("priceUpdatesOn") : t("priceUpdates")}
        </Cta>
      ) : null}
      {pushOffered ? (
        <Cta
          variant="ghost-contrast"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          title={pushGranted ? t("pushHint") : undefined}
          onClick={() => {
            setView("push")
            if (status === "idle" || status === "error") enable()
          }}
        >
          <Icon
            name={pushGranted ? "shield-check" : "browser"}
            draw={false}
            className={`h-4 w-4 shrink-0 ${pushGranted ? "text-mint" : ""}`}
          />
          {pushGranted ? t("outbidAlertsOn") : t("outbidAlerts")}
        </Cta>
      ) : null}
    </div>
  )
}

/** Block-explorer tx link for the receipt; null unless `hash` is a real 32-byte tx hash. */
function txExplorerUrl(hash: string, chainId: number): string | null {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) return null
  const base = chainId === sepolia.id ? "https://sepolia.etherscan.io" : "https://etherscan.io"
  return `${base}/tx/${hash}`
}

// Dev-only pacing so the approve/sign steps are visible before the contract is wired.
const devStepPause = () =>
  process.env.NODE_ENV === "production"
    ? Promise.resolve()
    : new Promise<void>((resolve) => setTimeout(resolve, 650))

type SubmitState =
  | "idle"
  | "confirming"
  | "submitting"
  | "approving"
  | "signing"
  | "pending"
  | "submitted"

/** Dev-only: seed BidRow into a money-loop sub-state for the /dev/states gallery. */
export type BidPreview = {
  state: SubmitState
  amountUsd: number
  priceUsd?: number
  txHash?: string
  error?: string
  raiseCta?: boolean
  /** Seeds the wallet-balance line + delta check (the gallery has no wallet to read). */
  balanceUsd?: number
  /** Seeds the confirm-step advisory blocker (the gallery has no Sonar to precheck). */
  precheck?: { reason: string; livenessUrl?: string }
  /** Gallery-only: force the tiered-bonus pill on in the confirm step (bypasses the flag during
   *  review). Never set in production. */
  bonus?: boolean
}

// Gallery balance seeds use USDC-like 6 decimals; null on anything out of range (never throw in render).
const PREVIEW_DECIMALS = 6
function previewBalanceUnits(usd?: number): bigint | null {
  if (usd == null || !Number.isFinite(usd) || usd < 0) return null
  const units = Math.round(usd * 10 ** PREVIEW_DECIMALS)
  return Number.isSafeInteger(units) ? BigInt(units) : null
}

export function BidFlow({
  journey,
  returning,
  clearingPriceUsd,
  totalCommittedUsd = 0,
  myBid,
  onConnectSonar,
  // Noop default so server-rendered galleries (which cannot pass functions) still show the
  // control; the live panel always provides the real handler.
  onSignOut = () => {},
  setupHref,
  onBid,
  onRaise,
  onPrecheck,
  active,
  entityLabel,
  preview,
}: {
  journey: JourneyState
  returning?: boolean
  clearingPriceUsd: number | null
  /** Live cumulative sale total (Sonar committed USD), for the tiered-bonus meter. */
  totalCommittedUsd?: number
  myBid: MyBid
  onConnectSonar?: () => void
  onSignOut?: () => void
  setupHref: string
  onBid?: (p: BidParams, opts?: { onStage?: (s: BidStage) => void }) => Promise<BidResult>
  onRaise?: () => void
  onPrecheck?: () => Promise<BidPrecheck>
  /** False while the panel is collapsed: pauses the wallet-balance polling. */
  active?: boolean
  /** Sonar label of the active entity, for the manage CTA on the KYC gates. */
  entityLabel?: string | null
  preview?: BidPreview
}) {
  return (
    <StateContent
      journey={journey}
      returning={returning}
      clearingPriceUsd={clearingPriceUsd}
      totalCommittedUsd={totalCommittedUsd}
      myBid={myBid}
      onConnectSonar={onConnectSonar}
      onSignOut={onSignOut}
      setupHref={setupHref}
      onBid={onBid}
      onRaise={onRaise}
      onPrecheck={onPrecheck}
      active={active}
      entityLabel={entityLabel}
      preview={preview}
    />
  )
}

function StateContent({
  journey,
  returning,
  clearingPriceUsd,
  totalCommittedUsd,
  myBid,
  onConnectSonar,
  onSignOut,
  setupHref,
  onBid,
  onRaise,
  onPrecheck,
  active,
  entityLabel,
  preview,
}: {
  journey: JourneyState
  returning?: boolean
  clearingPriceUsd: number | null
  totalCommittedUsd: number
  myBid: MyBid
  onConnectSonar?: () => void
  onSignOut: () => void
  setupHref: string
  onBid?: (p: BidParams, opts?: { onStage?: (s: BidStage) => void }) => Promise<BidResult>
  onRaise?: () => void
  onPrecheck?: () => Promise<BidPrecheck>
  active?: boolean
  entityLabel?: string | null
  preview?: BidPreview
}) {
  // Shared render path keeps BidRow's tree position across ready -> has-bid (stable key preserves the receipt).
  if (
    journey === "ready" ||
    journey === "has-bid-winning" ||
    journey === "has-bid-outbid" ||
    journey === "has-bid-pending"
  ) {
    return (
      <div className="flex w-full flex-col gap-2">
        <BidRow
          key="bid-row"
          clearingPriceUsd={clearingPriceUsd}
          totalCommittedUsd={totalCommittedUsd}
          prevBid={journey === "ready" ? undefined : myBid}
          outbid={journey === "has-bid-outbid"}
          onBid={onBid}
          onRaise={onRaise}
          onPrecheck={onPrecheck}
          active={active}
          preview={preview}
        />
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="min-w-0 flex-1">
        <GateContent
          journey={journey}
          returning={returning}
          onConnectSonar={onConnectSonar}
          onSignOut={onSignOut}
          setupHref={setupHref}
          entityLabel={entityLabel}
        />
      </div>
    </div>
  )
}

function GateContent({
  journey,
  returning,
  onConnectSonar,
  onSignOut,
  setupHref,
  entityLabel,
}: {
  journey: JourneyState
  returning?: boolean
  onConnectSonar?: () => void
  onSignOut: () => void
  setupHref: string
  entityLabel?: string | null
}) {
  const t = useTranslations("Bid")
  const st = useTranslations("Sale") as unknown as SaleTranslator
  const vs = verifyStatus(st)
  const vi = verifyIncomplete(st)
  const wb = welcomeBack(st)
  const failedHref = supportVerifyFailedHref(st)
  // Dark-capsule variant of the pre-sale bar's manage CTA (same states, same destination).
  const manageCta = (
    <ManageEntityCta
      href={setupHref}
      label={entityLabel}
      variant="ghost-contrast"
      onSignOut={onSignOut}
    />
  )
  switch (journey) {
    case "wrong-network":
      return <SwitchNetworkGate />
    case "kyc-incomplete":
      return (
        <GateRow
          icon={vi.icon}
          title={vi.title}
          cta={vi.cta}
          ctaHref={setupHref}
          secondary={<SonarSignOutButton onSignOut={onSignOut} variant="tile" />}
        />
      )
    case "kyc-required":
      return returning ? (
        <GateRow
          icon={wb.icon}
          title={wb.title}
          body={wb.body}
          cta={wb.cta}
          onCta={onConnectSonar}
        />
      ) : (
        <GateRow
          icon="shield-check"
          title={t("verifyIdentityTitle")}
          body={t("verifyIdentityBody")}
          cta={t("verifyWithSonar")}
          onCta={onConnectSonar}
        />
      )
    case "kyc-pending":
      return (
        <GateRow
          icon={vs.pending.icon}
          title={vs.pending.title}
          body={vs.pending.body}
          secondary={manageCta}
        />
      )
    case "kyc-failed":
      return (
        <GateRow
          icon={vs.failed.icon}
          tone={vs.failed.tone}
          title={vs.failed.title}
          body={vs.failed.body}
          cta={failedHref ? t("contactSupport") : undefined}
          ctaHref={failedHref ?? undefined}
          secondary={manageCta}
        />
      )
    case "not-eligible":
      return (
        <GateRow
          icon={vs["not-eligible"].icon}
          tone={vs["not-eligible"].tone}
          title={vs["not-eligible"].title}
          body={vs["not-eligible"].body}
          secondary={manageCta}
        />
      )
    default:
      return <ConnectChoices />
  }
}

function GateRow({
  icon,
  title,
  body,
  cta,
  onCta,
  ctaHref,
  secondary,
  tone = "default",
}: {
  icon: string
  title: string
  body?: string
  cta?: string
  onCta?: () => void
  ctaHref?: string
  secondary?: ReactNode
  tone?: "default" | "danger"
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex items-center gap-3">
        <Icon
          name={icon}
          draw={false}
          className={`h-5 w-5 shrink-0 ${tone === "danger" ? "text-danger" : "text-foreground"}`}
        />
        <p className="text-sm">
          <span className="font-medium text-foreground">{title}.</span>
          {body ? <span className="ml-1.5 text-muted">{body}</span> : null}
        </p>
      </div>
      <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        {ctaHref && cta ? (
          <Cta
            variant="solid-contrast"
            href={ctaHref}
            onClick={() => track("sonar_setup_opened", { placement: "bid-panel" })}
            external
          >
            {cta}
          </Cta>
        ) : cta ? (
          <Cta variant="solid-contrast" onClick={onCta}>
            {cta}
          </Cta>
        ) : null}
        {secondary}
      </div>
    </div>
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
  prompt,
  previewConnectors,
}: { prompt?: string; previewConnectors?: PickerConnector[] } = {}) {
  const t = useTranslations("Bid")
  const resolvedPrompt = prompt ?? t("connectPrompt")
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
            {error ? t("connectionFailed") : resolvedPrompt}
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

function SwitchNetworkGate() {
  const t = useTranslations("Bid")
  const { switchChain, isPending, error } = useSwitchChain()
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
      <div className="flex items-center gap-3">
        <Icon name="network" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
        <p className="text-sm">
          <span className="font-medium text-foreground">{t("wrongNetwork")}</span>
          <span className={`ml-1.5 ${error ? "text-danger" : "text-muted"}`}>
            {error ? t("switchFailed") : t("switchNetworkPrompt", { chain: SALE_CHAIN.name })}
          </span>
        </p>
      </div>
      <Cta
        variant="solid-contrast"
        className="ml-auto"
        onClick={() => switchChain({ chainId: SALE_CHAIN.id })}
        disabled={isPending}
      >
        {isPending ? t("switching") : t("switchToChain", { chain: SALE_CHAIN.name })}
      </Cta>
    </div>
  )
}

// Stable reason code -> translation key map. Keys are used as analytics ids (never translated);
// values name the Bid-namespace message. wrong-chain interpolates the chain name.
const BID_FAIL_KEYS: Record<string, string> = {
  "requires-liveness": "failRequiresLiveness",
  "wallet-risk": "failWalletRisk",
  "max-wallets-used": "failMaxWallets",
  "sale-not-active": "failSaleNotActive",
  "wallet-not-linked": "failWalletNotLinked",
  "outside-time-window": "failOutsideWindow",
  "session-expired": "failSessionExpired",
  "entity-not-eligible": "failEntityNotEligible",
  "Connect your wallet": "failConnectWallet",
  "wrong-chain": "failWrongChain",
  unknown: "failUnknown",
}

function reasonToMessage(t: SaleTranslator, reason: string): string {
  // On-chain reasons (bidRevertReason) are already messages; pass through if not a known code.
  const key = BID_FAIL_KEYS[reason]
  if (!key) return reason
  if (reason === "wrong-chain") return t(key, { chain: SALE_CHAIN.name })
  return t(key)
}

/** Small "+amount" pill shown on the bid CTAs when a raise adds USDC over the prior commitment. */
function DeltaCapsule({ added }: { added: number }) {
  if (!Number.isFinite(added) || added <= 0) return null
  return (
    <span className="rounded-full border border-current px-1.5 py-px text-[0.65em] font-bold tracking-normal opacity-70">
      +{fmtUsd(added)}
    </span>
  )
}

function BidRow({
  clearingPriceUsd,
  totalCommittedUsd = 0,
  prevBid,
  outbid,
  onBid,
  onRaise,
  onPrecheck,
  active,
  preview,
}: {
  clearingPriceUsd: number | null
  totalCommittedUsd?: number
  prevBid?: MyBid
  outbid?: boolean
  onBid?: (p: BidParams, opts?: { onStage?: (s: BidStage) => void }) => Promise<BidResult>
  onRaise?: () => void
  onPrecheck?: () => Promise<BidPrecheck>
  active?: boolean
  preview?: BidPreview
}) {
  const t = useTranslations("Bid")
  const st = t as unknown as SaleTranslator
  const minPrice = SALE_ECONOMICS.startingPriceUsd
  const increment = SALE_ECONOMICS.bidIncrementUsd
  // no upper price cap; grid is floor-anchored: minPrice + k*increment
  const band = { minPriceUsd: minPrice, incrementUsd: increment }
  const floor = snapBidPrice(
    Math.max(clearingPriceUsd ?? minPrice, prevBid?.priceUsd ?? 0, minPrice),
    band,
  )
  const [price, setPrice] = useState(
    preview?.priceUsd != null ? String(preview.priceUsd) : String(floor),
  )
  const [touched, setTouched] = useState(Boolean(preview))
  const [amount, setAmount] = useState(
    preview ? String(preview.amountUsd) : prevBid ? String(prevBid.committedUsd) : "",
  )
  const { address: draftAddress, connector } = useAccount()
  function onAmountChange(v: string) {
    setTouched(true)
    setAmount(v)
    if (!preview && draftAddress) writeBidDraft(v, draftAddress)
  }
  // Restore a fresh draft once, after a disconnect remount (client-only: sessionStorage is
  // unavailable during SSR, and seeding state in the initializer would desync hydration).
  // Never in a raise (prevBid seeds the committed floor) and never across wallets. touched
  // stays false so the price keeps tracking the live floor until the user actually interacts.
  const draftRestored = useRef(false)
  useEffect(() => {
    if (draftRestored.current || preview || prevBid || !draftAddress) return
    draftRestored.current = true
    const draft = readBidDraft(draftAddress)
    if (draft !== null && draft !== "") {
      setAmount(draft)
    }
  }, [preview, prevBid, draftAddress])
  const chainId = useChainId()
  // Funding token for THIS transaction (contract model: one bid, per-tx payment token). The picker
  // only exists once the sale registers several tokens; until then behavior is byte-identical.
  const paymentTokens = usePaymentTokens().data
  const multiToken = (paymentTokens?.length ?? 0) > 1
  const [payTokenAddress, setPayTokenAddress] = useState<`0x${string}` | null>(null)
  const payToken = paymentTokens?.length
    ? (paymentTokens.find((t) => t.address === payTokenAddress) ??
      defaultPaymentToken(paymentTokens))
    : undefined
  // Picker lists the default first, not the contract's registration order.
  const orderedTokens =
    multiToken && paymentTokens
      ? [
          defaultPaymentToken(paymentTokens),
          ...paymentTokens.filter((t) => t !== defaultPaymentToken(paymentTokens)),
        ]
      : paymentTokens
  const [submitState, setSubmitState] = useState<SubmitState>(preview?.state ?? "idle")
  // Advisory confirm-step blocker; display-only, the submit-time prePurchaseCheck stays the authority.
  const [precheckNotice, setPrecheckNotice] = useState<{
    reason: string
    livenessUrl: string | null
  } | null>(
    preview?.precheck
      ? { reason: preview.precheck.reason, livenessUrl: preview.precheck.livenessUrl ?? null }
      : null,
  )
  // FOOTGUN: monotonic token - without it a slow earlier precheck can overwrite a newer answer
  // and resurface a stale blocker after the user already cleared it.
  const precheckSeq = useRef(0)
  function enterConfirm() {
    track("bid_started", { raise: !!prevBid, token: payToken?.symbol ?? "unknown" })
    setSubmitState("confirming")
    if (!onPrecheck) return
    setPrecheckNotice(null)
    const seq = ++precheckSeq.current
    onPrecheck()
      .then((r) => {
        if (!aliveRef.current || seq !== precheckSeq.current) return
        if (r.ready) {
          setPrecheckNotice(null)
        } else {
          // A blocker shown before the user ever submits (e.g. wallet-risk): count it here, or
          // seen-but-abandoned blocks never reach the bid_failed path and go uncounted.
          setPrecheckNotice({ reason: r.reason, livenessUrl: r.livenessUrl })
          track("bid_precheck_blocked", { reason: bidFailureCode(r.reason) })
        }
      })
      .catch(() => {}) // onPrecheck is fail-open today; guards future wiring
  }
  useEffect(() => {
    if (!preview && submitState === "submitted") clearBidDraft()
  }, [submitState, preview])
  // True while the post-bid opt-in slot shows a dedicated view: the receipt row then hides its
  // Transaction link to free horizontal space for the email field / status text.
  const [optInDetail, setOptInDetail] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(preview?.txHash ?? null)
  // Atomic failure snapshot: wallet/token/time are captured when the error lands, so a later
  // connector or token switch cannot desync the support mail from the failure it describes.
  const [submitFailure, setSubmitFailure] = useState<{
    message: string
    at?: string
    wallet?: string
    token?: string
  } | null>(preview?.error ? { message: preview.error } : null)
  // UA read post-mount: SSR has no navigator and hydration must render the same href.
  const [browserInfo, setBrowserInfo] = useState<string | null>(null)
  useEffect(() => setBrowserInfo(navigator.userAgent), [])
  const aliveRef = useRef(true)
  // One ref shared by the mutually-exclusive view containers below: each submit-state change
  // unmounts the element that held focus, so the incoming view takes it (and gets announced).
  const viewRef = useViewFocus<HTMLDivElement>(submitState)

  const priceNum = Number(price)
  const amountNum = parseDecimal(amount)
  const priceCheck = validateBidPrice(priceNum, {
    minPriceUsd: minPrice,
    incrementUsd: increment,
    prevPriceUsd: prevBid?.priceUsd,
  })
  const minCommitFloor = SALE_ECONOMICS.minCommitmentUsd
  const maxCommit = SALE_ECONOMICS.maxCommitmentUsd
  const minCommit = prevBid ? Math.max(minCommitFloor, prevBid.committedUsd) : minCommitFloor
  const amountCheck = validateBidAmount(amountNum, minCommit, maxCommit)
  const priceShown = price !== "" && !Number.isNaN(priceNum)
  const amountShown = amount !== "" && !Number.isNaN(amountNum)

  // Wallet balance for the balance line + delta cover check. Fail-open: an unknown balance
  // renders nothing and blocks nothing - the on-chain preflight stays the authority. The read
  // is disabled while the panel is collapsed (active=false) so no idle polling runs off-screen.
  const liveBalance = useTokenBalance(preview || active === false ? undefined : payToken)
  const balanceDecimals = preview ? PREVIEW_DECIMALS : (payToken?.decimals ?? null)
  const balanceUnits = preview
    ? previewBalanceUnits(preview.balanceUsd)
    : (liveBalance.data ?? null)
  // Floored so the line never overstates what the wallet holds.
  const balanceUsdShown =
    balanceUnits != null && balanceDecimals != null
      ? Math.floor(Number(balanceUnits) / 10 ** balanceDecimals)
      : null
  // FOOTGUN: the slot must exist during the in-flight read, or the token picker jumps on load.
  const balanceSlot = balanceUsdShown != null || (!preview && liveBalance.isLoading)
  const balanceCovered =
    amountShown && balanceDecimals != null
      ? balanceCoversBid(amountNum, prevBid?.committedUsd ?? 0, balanceUnits, balanceDecimals)
      : null

  const snappedRef = Number.isFinite(priceNum) && priceNum > 0 ? snapBidPrice(priceNum, band) : null
  const nextUp = snappedRef != null ? snapBidPrice(snappedRef + increment, band) : null
  const nextDown = snappedRef != null ? snapBidPrice(snappedRef - increment, band) : null
  function stepPrice(dir: 1 | -1) {
    setTouched(true)
    if (snappedRef == null) {
      setPrice(String(floor))
      return
    }
    const next = snapBidPrice(snappedRef + dir * increment, band)
    setPrice(String(Math.max(next, floor)))
  }
  useEffect(() => {
    if (!touched) setPrice(String(floor))
  }, [floor, touched])
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])
  const priceValid = priceShown && priceCheck === "ok"
  const amountValid = amountShown && amountCheck === "ok"
  const raisesSomething =
    !prevBid || priceNum > prevBid.priceUsd || amountNum > prevBid.committedUsd
  const canSubmit =
    priceValid &&
    amountValid &&
    raisesSomething &&
    balanceCovered !== false &&
    submitState === "idle"
  const est = gnotEstimate(amountValid ? amountNum : 0, clearingPriceUsd ?? minPrice)
  // Second estimate at the bidder's own max price - only meaningful while winning with margin
  // (bid > clearing). It is the floor of what they receive if the price climbs to their max.
  const showAtBid =
    amountValid && priceValid && clearingPriceUsd != null && priceNum > clearingPriceUsd
  const estAtBid = showAtBid ? gnotEstimate(amountNum, priceNum) : null

  const priceError =
    priceShown && priceCheck === "below-min"
      ? t("errMinPrice", { price: fmtPrice(minPrice) })
      : priceShown && priceCheck === "off-increment"
        ? t("errIncrement", { increment })
        : priceShown && priceCheck === "below-previous" && prevBid
          ? t("errRaiseAbove", { price: fmtPrice(prevBid.priceUsd) })
          : null
  const amountError =
    amountShown && amountCheck === "too-low"
      ? prevBid
        ? t("errBelowCommitted", { amount: fmtUsd(prevBid.committedUsd) })
        : t("errMinAmount", { amount: fmtUsd(minCommitFloor) })
      : null
  // Delta-aware: only the amount above the committed floor is transferred on a raise.
  const balanceError =
    amountShown && amountCheck === "ok" && balanceCovered === false
      ? prevBid
        ? t("errBalanceDelta", { amount: fmtUsd(amountNum - prevBid.committedUsd) })
        : t("errInsufficient", { symbol: payToken?.symbol ?? "USDC" })
      : null

  const headroom =
    priceValid && clearingPriceUsd != null ? bidHeadroomPct(priceNum, clearingPriceUsd) : null
  const clearingNote =
    priceValid && clearingPriceUsd != null
      ? priceNum < clearingPriceUsd
        ? {
            tone: "warn" as const,
            text: t("noteBelowClearing"),
          }
        : headroom && headroom > 0
          ? {
              tone: "ok" as const,
              text: t("noteHeadroom", { pct: (headroom * 100).toFixed(1) }),
            }
          : {
              tone: "ok" as const,
              text: t("noteAtClearing"),
            }
      : null

  const raiseNote =
    prevBid && priceValid && amountValid && !raisesSomething ? t("noteUnchanged") : null

  const supportHref = submitFailure
    ? supportMailtoHref(
        t("supportSubjectBidError", { message: submitFailure.message }),
        [
          t("supportBidShowed", { message: punctuate(submitFailure.message) }),
          submitFailure.wallet && t("supportWallet", { wallet: submitFailure.wallet }),
          submitFailure.token && t("supportPaymentToken", { token: submitFailure.token }),
          t("supportNetwork", { network: SALE_CHAIN.name }),
          submitFailure.at && t("supportWhen", { when: submitFailure.at }),
          browserInfo && t("supportBrowser", { browser: browserInfo }),
        ],
        st,
      )
    : null

  async function runSubmit() {
    setSubmitFailure(null)
    // lockup:false here = the user opt-in (no toggle surfaced). The compliance-forced US lockup
    // is applied in useBid from the trusted server entity region (Sonar A.17.8), not in the form.
    const params: BidParams = {
      priceUsd: priceNum,
      amountUsd: amountNum,
      lockup: false,
      token: payToken?.address,
    }
    if (onBid) {
      setSubmitState("submitting")
      track("bid_submitted", { raise: !!prevBid, token: payToken?.symbol ?? "unknown" })
      const result = await onBid(params, {
        onStage: (s) => {
          if (aliveRef.current) setSubmitState(s)
        },
      })
      if (!aliveRef.current) return
      if (result.status === "submitted") {
        track("bid_confirmed", {
          raise: !!prevBid,
          token: payToken?.symbol ?? "unknown",
          amount_bucket: bidAmountBucket(amountNum),
          // Friction gauge: whole seconds from page load to on-chain confirmation.
          seconds_to_bid: Math.round(performance.now() / 1000),
        })
        setTxHash(result.txHash)
        setSubmitState("submitted")
      } else {
        track("bid_failed", { reason: bidFailureCode(result.reason) })
        setSubmitState("idle")
        setSubmitFailure({
          message: reasonToMessage(st, result.reason),
          // Minute precision: enough for triage, too coarse to correlate with on-chain txs.
          at: `${new Date().toISOString().slice(0, 16)}Z`,
          wallet: connector?.name,
          token: payToken?.symbol,
        })
      }
      return
    }
    // /dev/states gallery (no real submitter): keep the paced approve/sign animation.
    setSubmitState("approving")
    await devStepPause()
    if (!aliveRef.current) return
    setSubmitState("signing")
    const pre = await submitter.preflight(params)
    if (!aliveRef.current) return
    if (!pre.ok) {
      setSubmitState("idle")
      return
    }
    setSubmitState("pending")
    await devStepPause()
    await submitter.submit(params)
    if (!aliveRef.current) return
    setSubmitState("submitted")
  }

  if (submitState === "confirming") {
    return (
      <div
        ref={viewRef}
        tabIndex={-1}
        className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 focus:outline-none"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium text-foreground">
              {t("confirmQuestion", { amount: fmtUsd(amountNum), price: fmtPrice(priceNum) })}
            </span>
            <span className="ml-1.5 text-muted">
              {t("confirmDetail", {
                est:
                  estAtBid != null && estAtBid < est
                    ? `~${fmtGnot(estAtBid)}-${fmtGnot(est)} GNOT`
                    : `~${fmtGnot(est)} GNOT`,
              })}
            </span>
            {prevBid ? null : (
              <TierBonusPill
                cumulativeUsd={totalCommittedUsd}
                amountUsd={amountNum}
                force={preview?.bonus}
                className="ml-2 align-middle"
              />
            )}
          </p>
          {prevBid ? (
            <p className="mt-1 text-xs text-muted">
              {amountNum > prevBid.committedUsd
                ? t("confirmDeltaCharged", { amount: fmtUsd(amountNum - prevBid.committedUsd) })
                : t("confirmNoExtra")}
              <TierBonusPill
                cumulativeUsd={totalCommittedUsd}
                amountUsd={amountNum}
                force={preview?.bonus}
                className="ml-2 align-middle"
              />
            </p>
          ) : null}
          {precheckNotice ? (
            <p className="mt-1 text-xs font-medium text-amber" role="alert">
              {reasonToMessage(st, precheckNotice.reason)}
              {precheckNotice.livenessUrl ? (
                <>
                  {" "}
                  <a
                    href={precheckNotice.livenessUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:opacity-75"
                  >
                    {t("startIdentityCheck")}
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-4">
          <Cta variant="solid-contrast" onClick={runSubmit}>
            {t("confirmBid")}
            <DeltaCapsule added={prevBid ? amountNum - prevBid.committedUsd : 0} />
          </Cta>
          <button
            type="button"
            onClick={() => setSubmitState("idle")}
            className="text-xs font-bold uppercase tracking-[0.2em] text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("back")}
          </button>
        </div>
      </div>
    )
  }

  if (
    submitState === "submitting" ||
    submitState === "approving" ||
    submitState === "signing" ||
    submitState === "pending"
  ) {
    const sym = payToken?.symbol ?? "USDC"
    // One entry per in-flight stage: title + detail live together so they can never desync.
    const stageCopy: Record<typeof submitState, { title: string; detail: string }> = {
      submitting: {
        title: t("stageSubmittingTitle"),
        detail: t("stageSubmittingDetail"),
      },
      approving: {
        title: t("stageApprovingTitle", { symbol: sym }),
        detail: t("stageApprovingDetail", { symbol: sym }),
      },
      signing: { title: t("stageSigningTitle"), detail: t("stageSigningDetail") },
      pending: { title: t("stagePendingTitle"), detail: t("stagePendingDetail") },
    }
    return (
      <div
        ref={viewRef}
        tabIndex={-1}
        className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 focus:outline-none"
      >
        <div className="flex items-center gap-3" aria-live="polite">
          <Icon name="clock" draw={false} className="h-5 w-5 shrink-0 text-foreground" />
          <p className="text-sm">
            <span className="font-medium text-foreground">{stageCopy[submitState].title}</span>
            <span className="ml-1.5 text-muted">{stageCopy[submitState].detail}</span>
          </p>
        </div>
      </div>
    )
  }

  if (submitState === "submitted") {
    const explorer = txHash ? txExplorerUrl(txHash, chainId) : null
    // One line, always: the confirmation and CTAs never wrap or shrink; the tiny privacy note
    // inside PostBidOptIns is the only elastic element (min-w-0, wraps its own text).
    return (
      <div
        ref={viewRef}
        tabIndex={-1}
        aria-live="polite"
        className="flex items-center justify-between gap-x-10 focus:outline-none"
      >
        <div className="flex shrink-0 items-center gap-3">
          <Icon name="shield-check" draw={false} className="h-5 w-5 shrink-0 text-mint" />
          <p className="whitespace-nowrap text-sm text-foreground">
            {t("bidSubmitted", { amount: fmtUsd(amountNum), price: fmtPrice(priceNum) })}
          </p>
          {optInDetail ? null : explorer ? (
            <a
              href={explorer}
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              {t("viewTx")}
            </a>
          ) : txHash ? (
            <span className="font-mono text-[11px] text-muted">{t("txRaw", { hash: txHash })}</span>
          ) : null}
          {/* Live: onRaise remounts BidFlow (epoch bump) so the form re-seeds from the fresh
              position. The in-place reset is the gallery fallback (preview has no panel). */}
          {(onRaise || preview?.raiseCta) && !optInDetail ? (
            <button
              type="button"
              onClick={() => (onRaise ? onRaise() : setSubmitState("idle"))}
              className="whitespace-nowrap text-xs text-muted underline underline-offset-2 hover:text-foreground"
            >
              {t("raiseBid")}
            </button>
          ) : null}
        </div>
        <PostBidOptIns bidLimitUsd={priceNum} onDetailChange={setOptInDetail} />
      </div>
    )
  }

  return (
    <div ref={viewRef} tabIndex={-1} className="flex flex-col gap-2 focus:outline-none">
      {outbid ? (
        <p className="text-xs font-bold text-danger" role="alert">
          {t("outbidAlert")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-start gap-x-5 gap-y-4">
        <div className="flex flex-col gap-1.5">
          <InputCell
            id="bid-price"
            label={t("bidPriceLabel")}
            value={price}
            onChange={setPrice}
            readOnly
            stepper={{
              onUp: () => stepPrice(1),
              onDown: () => stepPrice(-1),
              upDisabled: snappedRef != null && nextUp === snappedRef,
              downDisabled:
                snappedRef != null && (nextDown === snappedRef || (nextDown ?? 0) < floor),
              upLabel: t("stepUpLabel"),
              downLabel: t("stepDownLabel"),
            }}
            invalid={priceShown && priceCheck !== "ok"}
            hint={t("bidPriceHint", { increment, minPrice })}
            suffix={
              <>
                USD <span className="text-[0.7em] opacity-60">/ GNOT</span>
              </>
            }
            error={priceError}
            className="w-24"
          />
          {priceError || amountError || balanceError ? null : submitFailure ? (
            <p
              className="w-0 min-w-full whitespace-nowrap text-xs font-medium text-danger"
              role="alert"
            >
              <span className="inline-block max-w-[52ch] truncate align-bottom">
                {punctuate(submitFailure.message)}
              </span>
              {supportHref ? (
                <>
                  {" "}
                  <a href={supportHref} className="underline underline-offset-2 hover:opacity-75">
                    {t("support")}
                  </a>
                </>
              ) : null}
            </p>
          ) : raiseNote ? (
            <p className="w-0 min-w-full whitespace-nowrap text-xs text-muted">
              <span className="inline-block max-w-[60ch] truncate align-bottom">{raiseNote}</span>
            </p>
          ) : clearingNote ? (
            <p
              className={`w-0 min-w-full whitespace-nowrap text-xs ${
                clearingNote.tone === "warn" ? "font-medium text-amber" : "text-muted"
              }`}
            >
              <span className="inline-block max-w-[60ch] truncate align-bottom">
                {clearingNote.text}
                {clearingNote.tone === "ok" && estAtBid != null && estAtBid < est
                  ? ` ${t("noteStillGet", { amount: fmtCompact(estAtBid) })}`
                  : ""}
              </span>
            </p>
          ) : null}
        </div>
        <InputCell
          id="bid-amount"
          label={t("amountLabel")}
          value={amount}
          onChange={onAmountChange}
          invalid={amountShown && (amountCheck !== "ok" || balanceCovered === false)}
          placeholder={String(minCommitFloor)}
          hint={t("amountHint", { min: fmtUsd(minCommitFloor) })}
          error={amountError ?? balanceError}
          className="w-32"
          trailing={
            (multiToken && orderedTokens) || balanceSlot ? (
              // Stacked suffix: token picker on top, wallet balance under it, inside the h-12 box.
              <span className="flex flex-col items-end justify-center">
                {multiToken && orderedTokens ? (
                  <TokenSelect
                    tokens={orderedTokens}
                    value={payToken?.address}
                    onChange={(address) => {
                      setPayTokenAddress(address)
                      const symbol = orderedTokens.find((t) => t.address === address)?.symbol
                      if (symbol) track("token_selected", { token: symbol })
                    }}
                  />
                ) : null}
                {balanceSlot ? (
                  <span className="ml-1 whitespace-nowrap text-[9px] uppercase tracking-wide text-muted tabular-nums">
                    {t("balanceLabel", {
                      amount: balanceUsdShown != null ? fmtUsd(balanceUsdShown) : "…",
                    })}
                  </span>
                ) : null}
              </span>
            ) : undefined
          }
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
              {t("youReceive")}
            </span>
            <FieldHint text={t("youReceiveHint")} />
          </div>
          <div className="flex min-h-12 items-center gap-3">
            <span className="font-mono text-lg tabular-nums text-foreground">
              ~{fmtGnot(est)}
              <span className="ml-0.5 text-muted">GNOT</span>
            </span>
          </div>
          <p className="max-w-md truncate text-xs text-muted">{t("atCurrentClearing")}</p>
        </div>

        <div className="ml-auto flex flex-col gap-1.5">
          <span
            aria-hidden="true"
            className="invisible select-none text-[10px] uppercase tracking-[0.2em]"
          >
            .
          </span>
          <div className="flex h-12 items-center gap-4">
            <Cta variant="solid-contrast" onClick={enterConfirm} disabled={!canSubmit}>
              {prevBid ? t("raiseBid") : t("placeBid")}
              <DeltaCapsule added={prevBid ? amountNum - prevBid.committedUsd : 0} />
            </Cta>
          </div>
        </div>
      </div>
    </div>
  )
}

// A mid-bid wallet disconnect unmounts BidRow with the journey and used to come back to an empty
// form. Session-scoped (per tab), short TTL, keyed to the wallet (a different account must never
// inherit the draft); amount only - the price re-seeds from the live floor.
const BID_DRAFT_KEY = "gnot:bid-draft"
const BID_DRAFT_TTL_MS = 10 * 60 * 1000

function readBidDraft(address: string): string | null {
  try {
    const raw = window.sessionStorage.getItem(BID_DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as { amount?: unknown; ts?: unknown; address?: unknown }
    if (typeof draft.amount !== "string" || typeof draft.ts !== "number") return null
    if (draft.address !== address.toLowerCase()) return null
    return Date.now() - draft.ts > BID_DRAFT_TTL_MS ? null : draft.amount
  } catch {
    return null // private mode / storage disabled / corrupt entry
  }
}

function writeBidDraft(amount: string, address: string): void {
  try {
    window.sessionStorage.setItem(
      BID_DRAFT_KEY,
      JSON.stringify({ amount, address: address.toLowerCase(), ts: Date.now() }),
    )
  } catch {
    // private mode / storage disabled -> the draft just does not survive the unmount
  }
}

function clearBidDraft(): void {
  try {
    window.sessionStorage.removeItem(BID_DRAFT_KEY)
  } catch {
    // ignore: nothing to clear if storage is unavailable
  }
}

function sanitizeDecimal(v: string): string {
  // Commas stay visible as typed (EU decimal key / US grouping); parseDecimal disambiguates.
  const cleaned = v.replace(/[^0-9.,]/g, "")
  const [head, ...rest] = cleaned.split(".")
  return rest.length > 0 ? `${head}.${rest.join("")}` : head
}

const STEP_BTN =
  "flex shrink-0 cursor-pointer items-center justify-center rounded-md px-3 py-2 font-mono text-base leading-none disabled:pointer-events-none disabled:opacity-30"

function InputCell({
  id,
  label,
  value,
  onChange,
  readOnly = false,
  prefix,
  suffix,
  trailing,
  error,
  invalid,
  placeholder,
  hint,
  stepper,
  className = "",
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  readOnly?: boolean
  prefix?: string
  suffix?: ReactNode
  /** Interactive node after the input (e.g. the payment-token picker) - rendered without the
   *  decorative suffix's aria-hidden. */
  trailing?: ReactNode
  error?: string | null
  invalid: boolean
  placeholder?: string
  hint?: string
  stepper?: {
    onUp: () => void
    onDown: () => void
    upDisabled?: boolean
    downDisabled?: boolean
    upLabel: string
    downLabel: string
  }
  className?: string
}) {
  const [hintFlash, setHintFlash] = useState(false)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )
  function flashStepper() {
    if (!stepper) return
    setHintFlash(true)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setHintFlash(false), 400)
  }
  const stepBtnCls = `${STEP_BTN} ${
    hintFlash
      ? "bg-on-contrast text-surface-contrast"
      : "bg-border text-muted hover:bg-border-strong hover:text-foreground"
  }`
  return (
    <div className="relative flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <label htmlFor={id} className="text-[10px] uppercase tracking-[0.2em] text-muted">
          {label}
        </label>
        {hint ? <FieldHint text={hint} /> : null}
      </div>
      <div
        className={`flex h-12 items-center rounded-[var(--radius-md)] border bg-surface-alt ${
          stepper ? "pl-2" : "pl-3.5"
        } pr-3.5 transition-colors ${
          invalid
            ? "border-danger"
            : readOnly
              ? "border-border"
              : "border-border focus-within:border-faint"
        }`}
      >
        {stepper ? (
          <div className="mr-2 flex items-center gap-0.5">
            <button
              type="button"
              aria-label={stepper.downLabel}
              onClick={stepper.onDown}
              disabled={stepper.downDisabled}
              className={stepBtnCls}
            >
              -
            </button>
            <button
              type="button"
              aria-label={stepper.upLabel}
              onClick={stepper.onUp}
              disabled={stepper.upDisabled}
              className={stepBtnCls}
            >
              +
            </button>
          </div>
        ) : null}
        {prefix ? (
          <span aria-hidden="true" className="mr-1 font-mono text-lg text-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(e) => onChange(sanitizeDecimal(e.target.value))}
          onFocus={flashStepper}
          onKeyDown={
            stepper
              ? (e) => {
                  if (e.key === "ArrowUp") {
                    e.preventDefault()
                    stepper.onUp()
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault()
                    stepper.onDown()
                  }
                }
              : undefined
          }
          aria-invalid={invalid || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${className} bg-transparent font-mono text-lg tabular-nums text-foreground outline-none`}
        />
        {suffix ? (
          <span aria-hidden="true" className="ml-1 whitespace-nowrap font-mono text-sm text-muted">
            {suffix}
          </span>
        ) : null}
        {trailing ?? null}
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-0.5 w-0 min-w-full truncate text-xs font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Per-transaction funding token picker (the "USDC ▾" suffix of the Amount field); rendered only
 *  once the sale accepts several tokens. Native select: keyboard + screen reader for free. */
function TokenSelect({
  tokens,
  value,
  onChange,
}: {
  tokens: readonly { address: `0x${string}`; symbol: string }[]
  value?: `0x${string}`
  onChange: (address: `0x${string}`) => void
}) {
  const t = useTranslations("Bid")
  return (
    <span className="relative ml-1 inline-flex items-center whitespace-nowrap font-mono text-sm text-muted transition-colors focus-within:text-foreground hover:text-foreground">
      <select
        aria-label={t("paymentToken")}
        value={value}
        onChange={(e) => onChange(e.target.value as `0x${string}`)}
        className="cursor-pointer appearance-none bg-transparent pr-[15px] outline-none"
      >
        {tokens.map((t) => (
          <option key={t.address} value={t.address}>
            {t.symbol}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 10 6"
        className="pointer-events-none absolute right-0 top-1/2 h-[6px] w-[9px] -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function FieldHint({ text }: { text: string }) {
  return (
    <span className="group/hint relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted transition-colors hover:text-foreground focus-visible:text-foreground"
      >
        <Icon name="help" draw={false} className="h-3.5 w-3.5" />
      </button>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-full z-[var(--z-modal)] mt-2 w-max max-w-[22rem] rounded-[var(--radius-md)] bg-on-contrast px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-surface-contrast opacity-0 shadow-lg transition-opacity duration-100 group-hover/hint:opacity-100 group-focus-within/hint:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}
