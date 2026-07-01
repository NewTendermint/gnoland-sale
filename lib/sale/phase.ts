import { SALE_ECONOMICS } from "./economics"
import type { PreSaleStage, SalePhase } from "./types"

/** The sale phase from the clock: pre-sale before it opens, live during the window, ended after. */
export function resolveSalePhase(nowMs: number): SalePhase {
  const opensMs = new Date(SALE_ECONOMICS.saleOpensIso).getTime()
  const closesMs = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
  if (nowMs < opensMs) return "pre-sale"
  if (nowMs < closesMs) return "live"
  return "ended"
}

export function resolvePreSaleStage(nowMs: number): PreSaleStage {
  const opensMs = new Date(SALE_ECONOMICS.registrationOpensIso).getTime()
  return nowMs >= opensMs ? "registration-open" : "registration-closed"
}
