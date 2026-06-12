"use client"

/**
 * Client context for the sale UI: phase + per-user journey + commitment data, read
 * once and shared by the BidPanel and the sections. The journey is derived by
 * deriveJourney (lib/sale/journey.ts) from the wallet + the session's Sonar entity;
 * this provider delegates to it rather than growing its own logic.
 *
 * Dev-only overrides (never in production): ?phase=pre-sale|live|ended,
 * ?registration=open|closed and ?journey=<state> preview any state without a
 * wallet or Sonar. ?auth=ok|error is production (Sonar OAuth return hint).
 */
import { useQueryClient } from "@tanstack/react-query"
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
  SonarReturn,
} from "../../lib/sale/types"
import { SUPPORTED_CHAIN_IDS } from "./web3"

type SaleContextValue = {
  phase: SalePhase
  preSaleStage: PreSaleStage
  journey: JourneyState
  commitment: CommitmentData
  myBid: MyBid
  /** Sonar OAuth return hint (?auth=ok|error), display-only; see lib/sale/types. */
  sonarReturn: SonarReturn
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
  // Dev-only pre-sale sub-stage pin (?registration=); wins over the clock below.
  const [stageOverride, setStageOverride] = useState<PreSaleStage | null>(null)
  // Sonar OAuth return hint, read once from ?auth= then stripped (see below).
  const [sonarReturn, setSonarReturn] = useState<SonarReturn>(null)
  // Sticky bid bar open/close (lifted from BidPanel so page CTAs can open it).
  const [bidPanelOpen, setBidPanelOpen] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    setPreSaleStage(resolvePreSaleStage(Date.now()))
    // Sonar OAuth return (?auth=ok|error from the callback redirect), read in every
    // environment. Display-only by design: "ok" only refetches the entity (the
    // journey moves when the server-confirmed status lands, never off the param)
    // and "error" surfaces a notice. Strip the param so a refresh or a shared URL
    // never re-triggers it.
    const url = new URL(window.location.href)
    const auth = url.searchParams.get("auth")
    if (auth === "ok" || auth === "error") {
      setSonarReturn(auth)
      url.searchParams.delete("auth")
      window.history.replaceState(window.history.state, "", url)
      if (auth === "ok") {
        queryClient.invalidateQueries({ queryKey: ["sale", "entity"] })
      }
    }
    if (process.env.NODE_ENV === "production") return
    const params = url.searchParams
    const p = params.get("phase")
    if (p) setPhase(resolveSalePhase({ override: p }))
    const j = params.get("journey")
    if (j && j in MOCK_JOURNEY_INPUTS) setJourneyOverride(j as JourneyState)
    // Dev-only pre-sale sub-stage pin (?registration=open|closed) so both pre-sale
    // bars are previewable regardless of today's date (spec 7.1 companion override).
    const r = params.get("registration")
    if (r === "open" || r === "closed") {
      setStageOverride(r === "open" ? "registration-open" : "registration-closed")
    }
  }, [queryClient])

  // Track the real clock so the pre-sale stage flips at its milestone without a
  // reload: re-resolve every 60s and on tab refocus. The dev pin wins when set.
  useEffect(() => {
    if (stageOverride) return
    const resolve = () => setPreSaleStage(resolvePreSaleStage(Date.now()))
    const id = setInterval(resolve, 60_000)
    document.addEventListener("visibilitychange", resolve)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", resolve)
    }
  }, [stageOverride])

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
    preSaleStage: stageOverride ?? preSaleStage,
    journey,
    commitment: sale.data,
    // The dev override shows the mock bid for has-bid states; otherwise the real
    // position (Sonar commitment, filtered by entity) drives it.
    myBid: journeyOverride ? MOCK_JOURNEY_INPUTS[journeyOverride].myBid : journeyInput.myBid,
    sonarReturn,
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
