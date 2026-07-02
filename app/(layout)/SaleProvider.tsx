"use client"

import { useQueryClient } from "@tanstack/react-query"
import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useAccount } from "wagmi"
import { useFunnelCapable } from "../../lib/device/funnel-gate"
import { SALE_CHAIN } from "../../lib/sale/contracts"
import { useEntity, useMyBid, useSaleData } from "../../lib/sale/hooks"
import { deriveJourney } from "../../lib/sale/journey"
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

type SaleContextValue = {
  phase: SalePhase
  preSaleStage: PreSaleStage
  journey: JourneyState
  commitment: CommitmentData
  myBid: MyBid
  /** Whether the entity / position reads have settled successfully at least once. The journey is
   *  derived from missing data as "unverified"/"no bid", so status-asserting UI must not render
   *  those claims before these are true (it would flash a false state on every load). */
  entityResolved: boolean
  positionResolved: boolean
  /** Sonar OAuth return hint (?auth=ok|error), display-only. */
  sonarReturn: SonarReturn
  /** Echo's hosted entity-setup page for this sale (app.echo.xyz/sonar/{saleUUID}). */
  sonarSetupUrl: string
  bidPanelOpen: boolean
  setBidPanelOpen: (open: boolean) => void
}

const SaleContext = createContext<SaleContextValue | null>(null)

export function SaleProvider({
  children,
  initialPhase,
  sonarSetupUrl,
}: { children: ReactNode; initialPhase: SalePhase; sonarSetupUrl: string }) {
  const { isConnected, chainId } = useAccount()
  const funnelCapable = useFunnelCapable()
  const sale = useSaleData()
  const entity = useEntity({ enabled: funnelCapable === true })
  const position = useMyBid({ enabled: funnelCapable === true })
  const [phase, setPhase] = useState<SalePhase>(initialPhase)
  const [preSaleStage, setPreSaleStage] = useState<PreSaleStage>("registration-closed")
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
        setBidPanelOpen(true)
      }
    }
  }, [queryClient])

  // A position read landing right after the Sonar OAuth return can settle null (it races the fresh
  // session) and useMyBid never refetches on its own - re-read once. An unchanged null does not
  // re-trigger the effect, so a genuine no-bid session never loops.
  useEffect(() => {
    if (sonarReturn !== "ok" || !position.isFetched || position.data != null) return
    const t = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["sale", "my-bid"] })
    }, 1000)
    return () => clearTimeout(t)
  }, [sonarReturn, position.isFetched, position.data, queryClient])

  // Re-resolves phase + stage every minute and on tab refocus, straight from the sale clock.
  useEffect(() => {
    const resolve = () => {
      setPreSaleStage(resolvePreSaleStage(Date.now()))
      setPhase(resolveSalePhase(Date.now()))
    }
    const id = setInterval(resolve, 60_000)
    document.addEventListener("visibilitychange", resolve)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", resolve)
    }
  }, [])

  // Remember (non-PII) that we've seen the entity, so a return after the 2h session greets "welcome back".
  useEffect(() => {
    if (entity.data) markSonarSeen()
  }, [entity.data])

  const value = useMemo<SaleContextValue>(() => {
    const onSaleChain = chainId === SALE_CHAIN.id
    const journeyInput: JourneyInput = {
      isConnected,
      isSaleChain: onSaleChain,
      setupState: entity.data?.setupState ?? null,
      eligibility: entity.data?.eligibility ?? null,
      myBid: position.data ?? null,
      clearingPriceUsd: sale.data.clearingPriceUsd,
    }
    return {
      phase,
      preSaleStage,
      journey: deriveJourney(journeyInput),
      commitment: sale.data,
      myBid: journeyInput.myBid,
      entityResolved: entity.isSuccess,
      positionResolved: position.isSuccess,
      sonarReturn,
      sonarSetupUrl,
      bidPanelOpen,
      setBidPanelOpen,
    }
  }, [
    chainId,
    isConnected,
    entity.data,
    entity.isSuccess,
    position.data,
    position.isSuccess,
    sale.data,
    phase,
    preSaleStage,
    sonarReturn,
    sonarSetupUrl,
    bidPanelOpen,
  ])

  return <SaleContext.Provider value={value}>{children}</SaleContext.Provider>
}

export function useSale(): SaleContextValue {
  const ctx = useContext(SaleContext)
  if (!ctx) throw new Error("useSale must be used within SaleProvider")
  return ctx
}
