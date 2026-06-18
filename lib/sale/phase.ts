import { SALE_ECONOMICS } from "./economics"
import type { PreSaleStage, SalePhase } from "./types"

export type OnChainStage = "PreOpen" | "Commitment" | "Cancellation" | "Settlement" | "Done"

const VALID_PHASES: readonly SalePhase[] = ["pre-sale", "live", "ended"]
const DEV_DEFAULT: SalePhase = "live"

const STAGE_TO_PHASE: Record<OnChainStage, SalePhase> = {
  PreOpen: "pre-sale",
  Commitment: "live",
  Cancellation: "ended",
  Settlement: "ended",
  Done: "ended",
}

/** Resolution order (first match wins): explicit override -> on-chain stage -> dev default. */
export function resolveSalePhase(args: {
  override?: string | null
  onChainStage?: OnChainStage | null
}): SalePhase {
  const { override, onChainStage } = args
  if (override && (VALID_PHASES as readonly string[]).includes(override)) {
    return override as SalePhase
  }
  if (onChainStage) return STAGE_TO_PHASE[onChainStage]
  return DEV_DEFAULT
}

export function resolvePreSaleStage(nowMs: number): PreSaleStage {
  const opensMs = new Date(SALE_ECONOMICS.registrationOpensIso).getTime()
  return nowMs >= opensMs ? "registration-open" : "registration-closed"
}
