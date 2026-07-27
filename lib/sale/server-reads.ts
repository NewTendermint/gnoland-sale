import "server-only"
import { http, createPublicClient, erc20Abi, fallback } from "viem"
import { settlementSaleAbi } from "./abi"
import { onchainPriceToUsd } from "./calc"
import { SALE_CHAIN, saleContractsFor } from "./contracts"
import { SALE_ECONOMICS } from "./economics"
import { rpcUrlsFor } from "./rpc"
import type { MyBid } from "./types"

// Dedicated server-side (Node) read client. NOT lib/sale/onchain.ts, which is "use client" and pulls
// in wagmiConfig + wallet connectors; this mirrors live-window.ts: keyed RPCs, then viem's default.
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

type TokenAmount = { token: `0x${string}`; amount: bigint }
type WalletState = {
  committedAmountByToken: readonly TokenAmount[]
  acceptedAmountByToken: readonly TokenAmount[]
}
// The single entity `entityStatesByIDs([id])` returns; shape asserted against the ABI (abi.ts l.118).
type EntityState = { walletStates: readonly WalletState[] }

/**
 * Sum committed + accepted base units across an entity's wallets and payment tokens. Uniform token
 * decimals (asserted by the caller) make cross-token base units additive. `committed` is GROSS - it
 * does NOT subtract cancelledAmountByToken; `accepted` is the settlement basis used for payout. Pure.
 */
export function sumEntityUnits(walletStates: readonly WalletState[]): {
  committed: bigint
  accepted: bigint
} {
  let committed = 0n
  let accepted = 0n
  for (const w of walletStates) {
    for (const c of w.committedAmountByToken) committed += c.amount
    for (const a of w.acceptedAmountByToken) accepted += a.amount
  }
  return { committed, accepted }
}

/** Base units -> USD for a token whose `decimals` was read from the contract. Pure. */
export function unitsToUsd(units: bigint, decimals: number): number {
  return Number(units) / 10 ** decimals
}

/**
 * The shared payment-token decimals. We enforce the contract's uniform-decimals assumption ourselves
 * (matching onchain.ts assertUniformDecimals) instead of trusting tokens[0]: a non-uniform token
 * added later would otherwise silently corrupt every USD figure. Throws (fails the run loud) rather
 * than writing wrong data.
 */
function uniformDecimals(perToken: readonly number[]): number {
  const first = perToken[0]
  const drift = perToken.find((d) => d !== first)
  if (drift !== undefined) {
    throw new Error(`Payment tokens disagree on decimals (${first} vs ${drift})`)
  }
  return first
}

/** The sale's uniform payment-token decimals, memoized per sale address (immutable once deployed,
 *  and this sits on a per-request path). Keyed, not a single slot: the sepolia address is
 *  env-overridable. null = no payment token provisioned, deliberately not cached. */
const decimalsCache = new Map<string, number>()

async function paymentDecimals(sale: `0x${string}`): Promise<number | null> {
  const cached = decimalsCache.get(sale)
  if (cached != null) return cached
  const tokens = await publicClient().readContract({
    address: sale,
    abi: settlementSaleAbi,
    functionName: "paymentTokens",
  })
  if (tokens.length === 0) return null
  const perTokenDecimals = await Promise.all(
    tokens.map((token) =>
      publicClient().readContract({ address: token, abi: erc20Abi, functionName: "decimals" }),
    ),
  )
  const decimals = uniformDecimals(perTokenDecimals.map(Number))
  decimalsCache.set(sale, decimals)
  return decimals
}

/** Contract `currentBid` -> UI USD. Pure. A zero amount is "no position", never a $0 bid: an
 *  entity that never bid reads as a zeroed row, not a revert. */
export function mapEntityBid(
  currentBid: { price: bigint; amount: bigint } | undefined,
  decimals: number,
): MyBid {
  if (!currentBid || currentBid.amount === 0n) return null
  return {
    priceUsd: onchainPriceToUsd(currentBid.price, SALE_ECONOMICS.bidIncrementUsd),
    committedUsd: unitsToUsd(currentBid.amount, decimals),
  }
}

/**
 * The entity's current bid, read from the sale contract - the authoritative per-entity total, with
 * no row cap. `currentBid.amount` holds across several wallets and across repeated (replacing)
 * bids: it is the same field the bid delta is computed against in onchain.ts.
 *
 * null = no bid. THROWS when the chain is unreadable, never null: a false "no bid" on an
 * irrevocable bid is what confirmed-read.ts exists to prevent (the route maps it to a 502).
 */
export async function readEntityBid(saleSpecificEntityId: `0x${string}`): Promise<MyBid> {
  const contracts = saleContractsFor(SALE_CHAIN.id)
  if (!contracts) {
    throw new Error("readEntityBid: no sale contract for the sale chain")
  }
  // Independent reads: one round trip on a cold instance. Promise.all rejects on the first
  // failure, which is what we want - an unreadable half must throw, never a partial position.
  const [decimals, states] = await Promise.all([
    paymentDecimals(contracts.settlementSale),
    publicClient().readContract({
      address: contracts.settlementSale,
      abi: settlementSaleAbi,
      functionName: "entityStatesByIDs",
      args: [[saleSpecificEntityId]],
    }),
  ])
  if (decimals == null) {
    throw new Error("readEntityBid: the sale lists no payment token")
  }
  return mapEntityBid(states[0]?.currentBid, decimals)
}

export type EntityCommitmentUsd = { committedUsd: number; acceptedUsd: number }

/**
 * Read each entity's on-chain commitment, normalized to USD. One multicall with allowFailure, so an
 * entity that never bid (its id reverts or returns empty) is simply skipped, never failing the batch.
 *
 * Returns a map keyed by the lowercased bytes16 id; ids ABSENT from the map have no on-chain
 * commitment yet. Returns **null** when there is no on-chain source to read (no sale contract for the
 * chain, or the contract lists no payment tokens yet) - the caller MUST treat null as "unknown, skip"
 * and never as "zero", or a provisioning gap would wipe every confirmed row.
 */
export async function readEntityCommitmentsUsd(
  entityIds: readonly string[],
): Promise<Map<string, EntityCommitmentUsd> | null> {
  const contracts = saleContractsFor(SALE_CHAIN.id)
  if (!contracts) return null
  const out = new Map<string, EntityCommitmentUsd>()
  if (entityIds.length === 0) return out
  const sale = contracts.settlementSale

  // Payment-token decimals are read from the contract, never hardcoded, and asserted uniform.
  const decimals = await paymentDecimals(sale)
  if (decimals == null) return null

  const results = await publicClient().multicall({
    allowFailure: true,
    contracts: entityIds.map((id) => ({
      address: sale,
      abi: settlementSaleAbi,
      functionName: "entityStatesByIDs",
      args: [[id as `0x${string}`]],
    })),
  })

  entityIds.forEach((id, i) => {
    const r = results[i]
    if (r.status !== "success") return
    // Boundary cast: viem widens the multicall result union across the ABI; the concrete shape is
    // entityStatesByIDs' return (abi.ts l.118), from which we read only walletStates + amounts.
    const state = (r.result as unknown as readonly EntityState[])[0]
    if (!state?.walletStates) return
    const { committed, accepted } = sumEntityUnits(state.walletStates)
    out.set(id.toLowerCase(), {
      committedUsd: unitsToUsd(committed, decimals),
      acceptedUsd: unitsToUsd(accepted, decimals),
    })
  })
  return out
}
