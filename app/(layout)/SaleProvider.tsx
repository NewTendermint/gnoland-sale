"use client"

import { useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useAccount } from "wagmi"
import { useFunnelCapable } from "../../lib/device/funnel-gate"
import { useEntity, useMyBid, useSaleData } from "../../lib/sale/hooks"
import { deriveJourney } from "../../lib/sale/journey"
import { MOCK_JOURNEY_INPUTS } from "../../lib/sale/mock"
import { stateOverridesEnabled } from "../../lib/sale/overrides"
import { resolvePreSaleStage, resolveSalePhase } from "../../lib/sale/phase"
import { markSonarSeen } from "../../lib/sale/returning"
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
  /** Sonar OAuth return hint (?auth=ok|error), display-only. */
  sonarReturn: SonarReturn
  bidPanelOpen: boolean
  setBidPanelOpen: (open: boolean) => void
}

const SaleContext = createContext<SaleContextValue | null>(null)

export function SaleProvider({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount()
  const funnelCapable = useFunnelCapable()
  const sale = useSaleData()
  const entity = useEntity({ enabled: funnelCapable === true })
  const position = useMyBid({ enabled: funnelCapable === true })
  const [phase, setPhase] = useState<SalePhase>(() =>
    resolveSalePhase({ override: process.env.NEXT_PUBLIC_SALE_PHASE }),
  )
  const [journeyOverride, setJourneyOverride] = useState<JourneyState | null>(null)
  const [preSaleStage, setPreSaleStage] = useState<PreSaleStage>("registration-closed")
  const [stageOverride, setStageOverride] = useState<PreSaleStage | null>(null)
  const [sonarReturn, setSonarReturn] = useState<SonarReturn>(null)
  const [bidPanelOpen, setBidPanelOpen] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    setPreSaleStage(resolvePreSaleStage(Date.now()))
    const url = new URL(window.location.href)
    const auth = url.searchParams.get("auth")
    if (auth === "ok" || auth === "error") {
      setSonarReturn(auth)
      url.searchParams.delete("auth")
      window.history.replaceState(window.history.state, "", url)
      if (auth === "ok") {
        queryClient.invalidateQueries({ queryKey: ["sale", "entity"] })
        // Returning from Sonar verification: open the funnel so the bidder continues
        // straight into Connect/Bid instead of landing on a collapsed pill.
        setBidPanelOpen(true)
      }
    }
    if (!stateOverridesEnabled()) return
    const params = url.searchParams
    const p = params.get("phase")
    if (p) setPhase(resolveSalePhase({ override: p }))
    const j = params.get("journey")
    if (j && j in MOCK_JOURNEY_INPUTS) setJourneyOverride(j as JourneyState)
    const r = params.get("registration")
    if (r === "open" || r === "closed") {
      setStageOverride(r === "open" ? "registration-open" : "registration-closed")
    }
  }, [queryClient])

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

  // Remember (non-PII) that we've seen the entity, so a return after the 2h session greets "welcome back".
  useEffect(() => {
    if (entity.data) markSonarSeen()
  }, [entity.data])

  const value = useMemo<SaleContextValue>(() => {
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
    return {
      phase,
      preSaleStage: stageOverride ?? preSaleStage,
      journey,
      commitment: sale.data,
      myBid: journeyOverride ? MOCK_JOURNEY_INPUTS[journeyOverride].myBid : journeyInput.myBid,
      sonarReturn,
      bidPanelOpen,
      setBidPanelOpen,
    }
  }, [
    chainId,
    isConnected,
    entity.data,
    position.data,
    sale.data,
    phase,
    stageOverride,
    preSaleStage,
    journeyOverride,
    sonarReturn,
    bidPanelOpen,
  ])

  return <SaleContext.Provider value={value}>{children}</SaleContext.Provider>
}

export function useSale(): SaleContextValue {
  const ctx = useContext(SaleContext)
  if (!ctx) throw new Error("useSale must be used within SaleProvider")
  return ctx
}
