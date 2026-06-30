import { SALE_ECONOMICS } from "./economics"
import type { PreSaleStage, SalePhase } from "./types"

const VALID_PHASES: readonly SalePhase[] = ["pre-sale", "live", "ended"]
const DEV_DEFAULT: SalePhase = "live"

/** Resolution order (first match wins): explicit env override -> the sale clock (the 3 economics
 *  dates) -> dev default. pre-sale before it opens, live during the window, ended after it closes. */
export function resolveSalePhase(args: { override?: string | null; now?: number }): SalePhase {
  const { override, now } = args
  if (override && (VALID_PHASES as readonly string[]).includes(override)) {
    return override as SalePhase
  }
  if (now != null) {
    const opensMs = new Date(SALE_ECONOMICS.saleOpensIso).getTime()
    const closesMs = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
    if (now < opensMs) return "pre-sale"
    if (now < closesMs) return "live"
    return "ended"
  }
  return DEV_DEFAULT
}

export function resolvePreSaleStage(nowMs: number): PreSaleStage {
  const opensMs = new Date(SALE_ECONOMICS.registrationOpensIso).getTime()
  return nowMs >= opensMs ? "registration-open" : "registration-closed"
}
