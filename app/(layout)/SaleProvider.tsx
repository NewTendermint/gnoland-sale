"use client"

/**
 * Client context for the sale UI. Phase + per-user journey + commitment data,
 * read once and shared by the BidPanel and (later) the sections. commitment/myBid
 * come from lib/sale/mock.ts. The journey is "disconnected" until the bid panel
 * opens and the lazily-loaded WalletScope pushes real wagmi state up via
 * setWalletJourney - this keeps wagmi out of the initial bundle. KYC/eligibility +
 * commitment reads stay mock (swap in /api/sonar/* behind this same shape).
 *
 * Dev-only overrides (never in production): ?phase=pre-sale|live|ended and
 * ?journey=<state> let us preview any state without a wallet or Sonar.
 */
import { createContext, useContext, useEffect, useState } from "react"
import type { Dispatch, ReactNode, SetStateAction } from "react"
import { MOCK_COMMITMENT_LIVE, MOCK_JOURNEY_INPUTS } from "../../lib/sale/mock"
import { resolvePreSaleStage, resolveSalePhase } from "../../lib/sale/phase"
import type {
  CommitmentData,
  JourneyState,
  MyBid,
  PreSaleStage,
  SalePhase,
} from "../../lib/sale/types"

type SaleContextValue = {
  phase: SalePhase
  preSaleStage: PreSaleStage
  journey: JourneyState
  commitment: CommitmentData
  myBid: MyBid
  /** Set by the lazily-mounted WalletScope to push real wallet state into the bar. */
  setWalletJourney: Dispatch<SetStateAction<JourneyState>>
}

const SaleContext = createContext<SaleContextValue | null>(null)

export function SaleProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SalePhase>(() =>
    resolveSalePhase({ override: process.env.NEXT_PUBLIC_SALE_PHASE }),
  )
  // Dev-only journey pin (?journey=); when unset the journey is wallet-derived.
  const [journeyOverride, setJourneyOverride] = useState<JourneyState | null>(null)
  const [preSaleStage, setPreSaleStage] = useState<PreSaleStage>("registration-closed")
  // Real wallet-derived journey, pushed up by the lazily-loaded WalletScope (only once
  // the bid panel opens, so wagmi stays out of the initial bundle). Connect + network
  // gates only; the full journey (KYC, eligibility, bids) will come from
  // deriveJourney(JourneyInput) once Sonar is wired - WalletScope must then DELEGATE
  // to deriveJourney (lib/sale/journey.ts), not grow its own logic.
  const [walletJourney, setWalletJourney] = useState<JourneyState>("disconnected")

  useEffect(() => {
    setPreSaleStage(resolvePreSaleStage(Date.now()))
    if (process.env.NODE_ENV === "production") return
    const params = new URLSearchParams(window.location.search)
    const p = params.get("phase")
    if (p) setPhase(resolveSalePhase({ override: p }))
    const j = params.get("journey")
    if (j && j in MOCK_JOURNEY_INPUTS) setJourneyOverride(j as JourneyState)
  }, [])

  const journey = journeyOverride ?? walletJourney

  const value: SaleContextValue = {
    phase,
    preSaleStage,
    journey,
    commitment: MOCK_COMMITMENT_LIVE,
    myBid: MOCK_JOURNEY_INPUTS[journey].myBid,
    setWalletJourney,
  }

  return <SaleContext.Provider value={value}>{children}</SaleContext.Provider>
}

export function useSale(): SaleContextValue {
  const ctx = useContext(SaleContext)
  if (!ctx) throw new Error("useSale must be used within SaleProvider")
  return ctx
}
