"use client"

/**
 * Client context for the sale UI. Phase + per-user journey + commitment data,
 * read once and shared by the BidPanel and (later) the sections. commitment/myBid
 * come from lib/sale/mock.ts. The journey is wallet-derived (useAccount): connect +
 * network gates only for now; the full journey (KYC, eligibility, bids) will come
 * from deriveJourney(JourneyInput) once Sonar is wired - this provider must then
 * DELEGATE to deriveJourney (lib/sale/journey.ts), not grow its own logic. KYC/
 * eligibility + commitment reads stay mock (swap in /api/sonar/* behind this shape).
 *
 * Dev-only overrides (never in production): ?phase=pre-sale|live|ended and
 * ?journey=<state> let us preview any state without a wallet or Sonar.
 */
import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useAccount } from "wagmi"
import { useEntity, useMyBid, useSaleData } from "../../lib/sale/hooks"
import { deriveJourney } from "../../lib/sale/journey"
import { MOCK_JOURNEY_INPUTS } from "../../lib/sale/mock"
import { resolvePreSaleStage, resolveSalePhase } from "../../lib/sale/phase"
import type {
  CommitmentData,
  JourneyInput,
  JourneyState,
  MyBid,
  PreSaleStage,
  SalePhase,
} from "../../lib/sale/types"
import { SUPPORTED_CHAIN_IDS } from "./web3"

type SaleContextValue = {
  phase: SalePhase
  preSaleStage: PreSaleStage
  journey: JourneyState
  commitment: CommitmentData
  myBid: MyBid
  bidPanelOpen: boolean
  setBidPanelOpen: (open: boolean) => void
}

const SaleContext = createContext<SaleContextValue | null>(null)

export function SaleProvider({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount()
  // Live auction metrics from /api/sonar/commitments (real fetch; fixture or
  // real Sonar behind the route). initialData keeps `commitment` always defined.
  const sale = useSaleData()
  // The session's Sonar entity (KYC + eligibility); data is null until connected
  // to Sonar. Feeds the journey below.
  const entity = useEntity()
  // The session's current position (price + committed), filtered server-side from
  // the commitment set by the entity. null until the entity has a commitment.
  const position = useMyBid()
  const [phase, setPhase] = useState<SalePhase>(() =>
    resolveSalePhase({ override: process.env.NEXT_PUBLIC_SALE_PHASE }),
  )
  // Dev-only journey pin (?journey=); when unset the journey is wallet-derived.
  const [journeyOverride, setJourneyOverride] = useState<JourneyState | null>(null)
  const [preSaleStage, setPreSaleStage] = useState<PreSaleStage>("registration-closed")
  // Sticky bid bar open/close (lifted from BidPanel so page CTAs can open it).
  const [bidPanelOpen, setBidPanelOpen] = useState(false)

  useEffect(() => {
    setPreSaleStage(resolvePreSaleStage(Date.now()))
    if (process.env.NODE_ENV === "production") return
    const params = new URLSearchParams(window.location.search)
    const p = params.get("phase")
    if (p) setPhase(resolveSalePhase({ override: p }))
    const j = params.get("journey")
    if (j && j in MOCK_JOURNEY_INPUTS) setJourneyOverride(j as JourneyState)
  }, [])

  // Real journey: delegate to deriveJourney (lib/sale/journey.ts) from the wallet
  // + the session's Sonar entity (KYC/eligibility) + the clearing price. The
  // ?journey= override (dev only) still wins for previewing any state.
  const onSupportedChain = chainId !== undefined && SUPPORTED_CHAIN_IDS.includes(chainId)
  const journeyInput: JourneyInput = {
    isConnected,
    isBaseChain: onSupportedChain,
    setupState: entity.data?.setupState ?? null,
    eligibility: entity.data?.eligibility ?? null,
    myBid: position.data ?? null,
    clearingPriceUsd: sale.data.clearingPriceUsd,
  }
  const journey = journeyOverride ?? deriveJourney(journeyInput)

  const value: SaleContextValue = {
    phase,
    preSaleStage,
    journey,
    commitment: sale.data,
    // The dev override shows the mock bid for has-bid states; otherwise the real
    // position (Sonar commitment, filtered by entity) drives it.
    myBid: journeyOverride ? MOCK_JOURNEY_INPUTS[journeyOverride].myBid : journeyInput.myBid,
    bidPanelOpen,
    setBidPanelOpen,
  }

  return <SaleContext.Provider value={value}>{children}</SaleContext.Provider>
}

export function useSale(): SaleContextValue {
  const ctx = useContext(SaleContext)
  if (!ctx) throw new Error("useSale must be used within SaleProvider")
  return ctx
}
