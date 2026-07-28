"use client"

import { useViewFocus } from "@/lib/a11y/focus"
import { bidAmountBucket, bidFailureCode, track } from "@/lib/analytics/track"
import { clearBidDraft, readBidDraft, writeBidDraft } from "@/lib/sale/bid-draft"
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
import { hasPositionJourney } from "@/lib/sale/journey"
import {
  SUPPORT_DISCORD_HREF,
  type SaleTranslator,
  punctuate,
  supportMailtoHref,
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
import { sepolia } from "viem/chains"
import { useAccount, useChainId } from "wagmi"
import { Cta } from "../../(ui)/Cta"
import { Icon } from "../../(ui)/Icon"
import { DeltaCapsule, FieldHint, InputCell, TokenSelect } from "./BidFields"
import { GateSection } from "./GateSection"
import { PostBidOptIns } from "./PostBidOptIns"

// The money loop. A journey state routes to either the pre-bid gates (./GateSection) or BidRow,
// which validates an amount + price, walks the approve/sign/submit stages and renders the receipt.
// Form primitives: ./BidFields. Draft persistence: @/lib/sale/bid-draft. On-chain submission
// arrives through the onBid prop (@/lib/sale/onchain).

const submitter = new MockBidSubmitter()

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
  if (hasPositionJourney(journey)) {
    return (
      <div className="flex w-full flex-col gap-2">
        <BidRow
          key="bid-row"
          clearingPriceUsd={clearingPriceUsd}
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
    <GateSection
      journey={journey}
      returning={returning}
      onConnectSonar={onConnectSonar}
      onSignOut={onSignOut}
      setupHref={setupHref}
      entityLabel={entityLabel}
    />
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

function BidRow({
  clearingPriceUsd,
  prevBid,
  outbid,
  onBid,
  onRaise,
  onPrecheck,
  active,
  preview,
}: {
  clearingPriceUsd: number | null
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
  // The mailto body keys live in the Sale namespace; st above is the reused Bid translator.
  const saleT = useTranslations("Sale") as unknown as SaleTranslator
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
    // `!prevBid` mirrors the restore effect below: a raise-era amount must not survive to
    // pre-fill a later no-position form as something the user never committed to.
    if (!preview && !prevBid && draftAddress) writeBidDraft(v, draftAddress)
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
        saleT,
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
          </p>
          {prevBid ? (
            <p className="mt-1 text-xs text-muted">
              {amountNum > prevBid.committedUsd
                ? t("confirmDeltaCharged", { amount: fmtUsd(amountNum - prevBid.committedUsd) })
                : t("confirmNoExtra")}
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
              {SUPPORT_DISCORD_HREF ? (
                <a
                  href={SUPPORT_DISCORD_HREF}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ml-2 underline underline-offset-2 hover:opacity-75"
                >
                  {t("getHelp")}
                </a>
              ) : null}
              {SUPPORT_DISCORD_HREF && supportHref ? " · " : null}
              {supportHref ? (
                <a
                  href={supportHref}
                  className={`underline underline-offset-2 hover:opacity-75${
                    SUPPORT_DISCORD_HREF ? "" : " ml-2"
                  }`}
                >
                  {t("supportEmail")}
                </a>
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
