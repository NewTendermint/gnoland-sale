"use client"

/**
 * Client context for the sale UI. Phase + per-user journey + commitment data,
 * read once and shared by the BidPanel and (later) the sections. For now the
 * data comes from lib/sale/mock.ts; the real version swaps in a TanStack Query
 * read of /api/sonar/commitments + wagmi wallet state behind this same shape.
 *
 * Dev-only overrides (never in production): ?phase=pre-sale|live|ended and
 * ?journey=<state> let us preview any state without a wallet or Sonar.
 */
import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
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
}

const SaleContext = createContext<SaleContextValue | null>(null)

const DEFAULT_JOURNEY: JourneyState = "disconnected"

export function SaleProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SalePhase>(() =>
    resolveSalePhase({ override: process.env.NEXT_PUBLIC_SALE_PHASE }),
  )
  const [journey, setJourney] = useState<JourneyState>(DEFAULT_JOURNEY)
  const [preSaleStage, setPreSaleStage] = useState<PreSaleStage>("registration-closed")

  useEffect(() => {
    setPreSaleStage(resolvePreSaleStage(Date.now()))
    if (process.env.NODE_ENV === "production") return
    const params = new URLSearchParams(window.location.search)
    const p = params.get("phase")
    if (p) setPhase(resolveSalePhase({ override: p }))
    const j = params.get("journey")
    if (j && j in MOCK_JOURNEY_INPUTS) setJourney(j as JourneyState)
  }, [])

  const value: SaleContextValue = {
    phase,
    preSaleStage,
    journey,
    commitment: MOCK_COMMITMENT_LIVE,
    myBid: MOCK_JOURNEY_INPUTS[journey].myBid,
  }

  return <SaleContext.Provider value={value}>{children}</SaleContext.Provider>
}

export function useSale(): SaleContextValue {
  const ctx = useContext(SaleContext)
  if (!ctx) throw new Error("useSale must be used within SaleProvider")
  return ctx
}
