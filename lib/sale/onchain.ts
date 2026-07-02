"use client"

import { wagmiConfig } from "@/app/(layout)/web3"
// The on-chain steps of the sale: the single swap point for going live. Real path = @wagmi/core
// actions against the deployed SettlementSale. When no contract is configured for the connected
// chain, the bid is blocked (a "wrong-chain" reverted result), never emulated.
import {
  getAccount,
  getPublicClient,
  readContract,
  signTypedData,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core"
import { erc20Abi, settlementSaleAbi } from "./abi"
import { priceUsdToOnchainPrice, usdToTokenUnits } from "./calc"
import { SALE_CHAIN, saleContractsFor } from "./contracts"
import { SALE_ECONOMICS } from "./economics"
import { toPurchasePermitV3 } from "./permit-map"
import type { BidParams, BidResult, BidStage } from "./submitter"
import type { SalePermit, SonarPermitV3 } from "./types"

type OnChainBidArgs = {
  params: BidParams
  permit: SalePermit
  wallet: `0x${string}`
  onStage?: (stage: BidStage) => void
}

export type ClaimResult =
  | { status: "claimed"; txHash: string }
  | { status: "reverted"; reason: string }

const PERMIT_TTL_S = 30 * 60

const EIP2612_PERMIT_TYPES = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const

/** One user-facing line for a wallet/contract failure (never leak raw revert data to the UI). */
function bidRevertReason(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/rejected|denied/i.test(msg)) return "You cancelled the signature"
  if (/insufficient|exceeds balance|transfer amount exceeds/i.test(msg)) {
    return "Insufficient USDC balance"
  }
  if (/BidPriceBelowMinPrice|BidPriceExceedsMaxPrice/i.test(msg)) {
    return "Your price is outside the allowed range"
  }
  if (/BidBelowMinAmount|BidExceedsMaxAmount/i.test(msg)) {
    return "Your amount is outside the allowed range"
  }
  if (/BidMustHaveLockup/i.test(msg)) return "This bid must include the lockup"
  if (/CannotBeLowered/i.test(msg)) return "A bid can only be raised, not lowered"
  if (/PurchasePermitExpired/i.test(msg)) return "Your authorization expired - please try again"
  if (/BidOutsideAllowedWindow|SalePaused/i.test(msg)) return "The sale isn't open right now"
  if (/WalletNotAssociatedWithEntity|InvalidSender|UnauthorizedSigner|NotInitialized/i.test(msg)) {
    return "This wallet isn't linked to your verified identity"
  }
  return "Could not place bid"
}

// The sale's payment token is immutable, so read (address + decimals) from the contract once per
// (chain, sale) and cache. Reading paymentTokens() means we bid in EXACTLY the token the deployed
// contract accepts - no hardcoded address/decimals to drift out of sync.
const paymentTokenCache = new Map<string, { address: `0x${string}`; decimals: number }>()

async function resolvePaymentToken(
  settlementSale: `0x${string}`,
  chainId: number,
): Promise<{ address: `0x${string}`; decimals: number }> {
  const key = `${chainId}:${settlementSale}`
  const cached = paymentTokenCache.get(key)
  if (cached) return cached
  const [token] = await readContract(wagmiConfig, {
    address: settlementSale,
    abi: settlementSaleAbi,
    functionName: "paymentTokens",
  })
  if (!token) {
    throw new Error("Sale has no payment token configured")
  }
  const decimals = await readContract(wagmiConfig, {
    address: token,
    abi: erc20Abi,
    functionName: "decimals",
  })
  const resolved = { address: token, decimals: Number(decimals) }
  paymentTokenCache.set(key, resolved)
  return resolved
}

/**
 * Decide the bid outcome from the mined receipt + any replacement. A wallet "cancel" is a 0-value
 * self-send that mines "success", so a cancellation must read as a reverted bid, not a placed one;
 * a speed-up/reprice ("replaced"/"repriced") is the SAME bid and stays valid, at the mined hash.
 */
export function interpretBidReceipt(
  receipt: { status: "success" | "reverted"; transactionHash: string },
  replacementReason: "replaced" | "repriced" | "cancelled" | null,
): BidResult {
  if (replacementReason === "cancelled") {
    return { status: "reverted", reason: "You cancelled the transaction" }
  }
  if (receipt.status !== "success") {
    return { status: "reverted", reason: "The bid transaction failed on-chain" }
  }
  return { status: "submitted", txHash: receipt.transactionHash }
}

/**
 * Cheap pre-signature guards from data already in hand (the permit + one balance read): reject a
 * doomed bid BEFORE the EIP-2612 wallet popup so no unused approval is signed. Returns a user-facing
 * reason (reusing bidRevertReason's wording), or null to proceed. Amount/price BOUNDS are left to
 * simulateContract on purpose - their "0 = no limit" semantics are not pinned here.
 */
export function bidPreflightReason(
  permit: SonarPermitV3,
  amountDelta: bigint,
  usdcBalance: bigint,
  nowSec: number,
): string | null {
  const expiresAt = Number(permit.ExpiresAt)
  if (expiresAt > 0 && nowSec >= expiresAt) {
    return "Your authorization expired - please try again"
  }
  if (amountDelta > 0n && usdcBalance < amountDelta) {
    return "Insufficient USDC balance"
  }
  return null
}

export async function submitBidOnChain(args: OnChainBidArgs): Promise<BidResult> {
  const { params, permit, wallet } = args
  if (!permit?.Signature) {
    return { status: "reverted", reason: "Missing purchase permit" }
  }

  const { chainId } = getAccount(wagmiConfig)
  if (chainId == null) {
    return { status: "reverted", reason: "Connect your wallet" }
  }
  if (chainId !== SALE_CHAIN.id) {
    return { status: "reverted", reason: "wrong-chain" }
  }
  const contracts = saleContractsFor(chainId)
  if (!contracts) {
    return { status: "reverted", reason: "wrong-chain" }
  }

  try {
    const purchasePermit = toPurchasePermitV3(permit.PermitJSON)
    const payment = await resolvePaymentToken(contracts.settlementSale, chainId)
    const bid = {
      lockup: params.lockup,
      price: priceUsdToOnchainPrice(params.priceUsd, SALE_ECONOMICS.bidIncrementUsd),
      amount: usdToTokenUnits(params.amountUsd, payment.decimals),
    }

    // The contract charges (and the EIP-2612 permit must cover) exactly newAmount minus the entity's
    // current on-chain commitment. Read it from chain (authoritative; Bid.amount is the per-entity
    // total, so this is correct even when an entity funds from several wallets).
    const states = await readContract(wagmiConfig, {
      address: contracts.settlementSale,
      abi: settlementSaleAbi,
      functionName: "entityStatesByIDs",
      args: [[purchasePermit.saleSpecificEntityID]],
    })
    const prevAmount = states[0]?.currentBid.amount ?? 0n
    const amountDelta = bid.amount > prevAmount ? bid.amount - prevAmount : 0n

    // Pre-signature guards: catch a dead permit / underfunded wallet BEFORE the EIP-2612 popup, so a
    // doomed bid never leaves an unused signed approval. Balance is only read when there's a delta.
    const usdcBalance =
      amountDelta > 0n
        ? await readContract(wagmiConfig, {
            address: payment.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [wallet],
          })
        : 0n
    const preflight = bidPreflightReason(
      permit.PermitJSON,
      amountDelta,
      usdcBalance,
      Math.floor(Date.now() / 1000),
    )
    if (preflight) {
      return { status: "reverted", reason: preflight }
    }

    let erc20PermitDeadline = 0n
    let erc20PermitSignature: `0x${string}` = "0x"

    // A price-only raise (delta 0) skips the transfer block on-chain, so no USDC permit is needed.
    if (amountDelta > 0n) {
      const [name, version, nonce] = await Promise.all([
        readContract(wagmiConfig, {
          address: payment.address,
          abi: erc20Abi,
          functionName: "name",
        }),
        readContract(wagmiConfig, {
          address: payment.address,
          abi: erc20Abi,
          functionName: "version",
        }).catch(() => "2"),
        readContract(wagmiConfig, {
          address: payment.address,
          abi: erc20Abi,
          functionName: "nonces",
          args: [wallet],
        }),
      ])
      erc20PermitDeadline = BigInt(Math.floor(Date.now() / 1000) + PERMIT_TTL_S)
      args.onStage?.("approving")
      erc20PermitSignature = await signTypedData(wagmiConfig, {
        domain: { name, version, chainId, verifyingContract: payment.address },
        types: EIP2612_PERMIT_TYPES,
        primaryType: "Permit",
        message: {
          owner: wallet,
          spender: contracts.settlementSale,
          value: amountDelta,
          nonce,
          deadline: erc20PermitDeadline,
        },
      })
    }

    const call = {
      address: contracts.settlementSale,
      abi: settlementSaleAbi,
      functionName: "replaceBidWithPermit",
      args: [
        payment.address,
        bid,
        purchasePermit,
        permit.Signature as `0x${string}`,
        erc20PermitDeadline,
        erc20PermitSignature,
      ],
      account: wallet,
    } as const

    await simulateContract(wagmiConfig, call) // pre-flight: surface reverts before the wallet popup
    args.onStage?.("signing")

    // Wallets (esp. Keplr's EVM path) under-estimate gas for this nested call - the permit + transferFrom
    // hit the EIP-150 63/64 forwarding rule, which eth_estimateGas under-counts too. Set the limit
    // explicitly from our own RPC (x3) over a floor safely above the ~393k a first bid measured on
    // Sepolia (used only if the estimate throws). Unused gas is refunded, so a high ceiling is free.
    let gas = 600_000n
    try {
      const publicClient = getPublicClient(wagmiConfig)
      if (publicClient) {
        const generous = (await publicClient.estimateContractGas(call)) * 3n
        if (generous > gas) gas = generous
      }
    } catch {
      // estimate failed (network/state); keep the floor
    }
    const txHash = await writeContract(wagmiConfig, { ...call, gas })
    // A wallet "cancel" replaces the bid tx with a 0-value self-send that MINES SUCCESSFULLY, so the
    // receipt reads "success" for a tx that never placed the bid. Capture any replacement and let
    // interpretBidReceipt tell a cancellation apart from a real bid (a speed-up/reprice stays valid).
    let replacementReason: "replaced" | "repriced" | "cancelled" | null = null
    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash: txHash,
      onReplaced: (r) => {
        replacementReason = r.reason
      },
    })
    return interpretBidReceipt(receipt, replacementReason)
  } catch (err) {
    return { status: "reverted", reason: bidRevertReason(err) }
  }
}

export async function claimRefundOnChain(args: { wallet: `0x${string}` }): Promise<ClaimResult> {
  const { chainId } = getAccount(wagmiConfig)
  if (chainId == null) {
    return { status: "reverted", reason: "Connect your wallet" }
  }
  if (chainId !== SALE_CHAIN.id) {
    return { status: "reverted", reason: "wrong-chain" }
  }
  const contracts = saleContractsFor(chainId)
  if (!contracts) {
    return { status: "reverted", reason: "wrong-chain" }
  }
  try {
    const call = {
      address: contracts.settlementSale,
      abi: settlementSaleAbi,
      functionName: "claimRefund",
      args: [],
      account: args.wallet,
    } as const
    await simulateContract(wagmiConfig, call)
    const txHash = await writeContract(wagmiConfig, call)
    const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash })
    if (receipt.status !== "success") {
      return { status: "reverted", reason: "The refund transaction failed" }
    }
    return { status: "claimed", txHash }
  } catch {
    return { status: "reverted", reason: "Could not claim your refund" }
  }
}
