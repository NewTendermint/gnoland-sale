import "server-only"
import { errorMessage } from "../log"
import { SALE_STAGE, settlementSaleAbi } from "./abi"
import { SALE_CHAIN, saleContractsFor } from "./contracts"
import { SALE_ECONOMICS } from "./economics"
import { resolveSalePhase } from "./phase"
import { publicClient } from "./server-client"

/**
 * Bids-open truth for the crons, chain-first: the deployed contract's stage() is authoritative
 * and survives a schedule shift the env dates missed. The env dates only decide when no contract
 * is configured for the chain or the RPC read fails - and that fallback is logged so a drifted
 * schedule cannot skip silently.
 */
export async function saleIsLive(nowMs: number): Promise<boolean> {
  const contracts = saleContractsFor(SALE_CHAIN.id)
  if (contracts) {
    try {
      const stage = await publicClient().readContract({
        address: contracts.settlementSale,
        abi: settlementSaleAbi,
        functionName: "stage",
      })
      return stage === SALE_STAGE.commitment
    } catch (err) {
      console.error(
        "live-window: stage() read failed, falling back to env dates:",
        errorMessage(err),
      )
    }
  }
  return resolveSalePhase(nowMs) === "live"
}

/**
 * Push-notification TTL from the sale window: the time left before the env close date, capped.
 * The cap alone when that date is malformed (NaN must never reach a TTL header) or already past
 * while the chain-first caller still says live - economics.ts warns the env dates drift and the
 * sale can be extended, and a 0 TTL would silently drop the one-shot alert for offline users.
 */
export function pushTtlSeconds(nowMs: number, capSeconds: number): number {
  const closeMs = new Date(SALE_ECONOMICS.saleClosesIso).getTime()
  if (!Number.isFinite(closeMs) || closeMs <= nowMs) return capSeconds
  return Math.min(Math.floor((closeMs - nowMs) / 1000), capSeconds)
}
