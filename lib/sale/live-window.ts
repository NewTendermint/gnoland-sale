import "server-only"
import { http, createPublicClient, fallback } from "viem"
import { errorMessage } from "../log"
import { SALE_STAGE, settlementSaleAbi } from "./abi"
import { SALE_CHAIN, saleContractsFor } from "./contracts"
import { resolveSalePhase } from "./phase"
import { rpcUrlsFor } from "./rpc"

let client: ReturnType<typeof createPublicClient> | null = null
function publicClient() {
  if (!client) {
    client = createPublicClient({
      chain: SALE_CHAIN,
      transport: fallback([...rpcUrlsFor(SALE_CHAIN.id).map((url) => http(url)), http()]),
    })
  }
  return client
}

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
