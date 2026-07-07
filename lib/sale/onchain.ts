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
import { BaseError, ChainMismatchError, ContractFunctionRevertedError } from "viem"
import { SALE_STAGE, erc20Abi, settlementSaleAbi } from "./abi"
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

/** Failure cases shared by the bid and claim paths: user rejection and a mid-flow wallet network
 *  switch (chainId is pinned on every write, so the tx was blocked, never sent on the wrong
 *  chain). "wrong-chain" is the existing sentinel the flows already render switch-back copy for.
 *  cancelledCopy names what the user rejected: a typed-data signature (EIP-2612 permit) or a
 *  transaction confirmation - the caller knows which prompt was open. */
function sharedWalletErrorReason(
  err: unknown,
  cancelledCopy = "You cancelled the signature.",
): string | null {
  if (err instanceof BaseError && err.walk((e) => e instanceof ChainMismatchError)) {
    return "wrong-chain"
  }
  const msg = err instanceof Error ? err.message : String(err)
  if (/rejected|denied/i.test(msg)) return cancelledCopy
  if (/does not match the target chain|chain mismatch/i.test(msg)) return "wrong-chain"
  return null
}

/** One user-facing line for a wallet/contract failure (never leak raw revert data to the UI). */
function bidRevertReason(err: unknown, tokenSymbol = "USDC", cancelledCopy?: string): string {
  const shared = sharedWalletErrorReason(err, cancelledCopy)
  if (shared) return shared
  const msg = err instanceof Error ? err.message : String(err)
  if (/insufficient|exceeds balance|transfer amount exceeds/i.test(msg)) {
    return `Insufficient ${tokenSymbol} balance.`
  }
  if (/BidPriceBelowMinPrice|BidPriceExceedsMaxPrice/i.test(msg)) {
    return "Your price is outside the allowed range."
  }
  if (/BidBelowMinAmount|BidExceedsMaxAmount/i.test(msg)) {
    return "Your amount is outside the allowed range."
  }
  if (/BidMustHaveLockup/i.test(msg)) return "This bid must include the lockup."
  if (/CannotBeLowered/i.test(msg)) return "A bid can only be raised, not lowered."
  if (/PurchasePermitExpired/i.test(msg)) return "Your authorization expired, please try again."
  if (/BidOutsideAllowedWindow|SalePaused/i.test(msg)) return "The sale isn't open right now."
  if (/WalletTiedToAnotherEntity/i.test(msg)) {
    return "This wallet is already linked to another account."
  }
  if (/WalletNotAssociatedWithEntity|InvalidSender|UnauthorizedSigner|NotInitialized/i.test(msg)) {
    return "This wallet isn't linked to your verified identity."
  }
  return "Could not place bid."
}

export type PaymentToken = { address: `0x${string}`; symbol: string; decimals: number }

/** The contract assumes uniform decimals + 1:1 parity across payment tokens (SettlementSale.sol);
 *  enforce the decimals part - every USD conversion in the app depends on it. */
export function assertUniformDecimals(
  tokens: readonly { symbol: string; decimals: number }[],
): void {
  if (tokens.length === 0) {
    throw new Error("Sale has no payment token configured")
  }
  const first = tokens[0]
  const drift = tokens.find((t) => t.decimals !== first.decimals)
  if (drift) {
    throw new Error(
      `Payment tokens disagree on decimals (${first.symbol}=${first.decimals}, ${drift.symbol}=${drift.decimals})`,
    )
  }
}

// The sale's primary token (UX default). NOT the contract's tokens[0]: the registration order is
// Echo's, not ours - the redeployed sandbox lists USDT first.
const DEFAULT_TOKEN_SYMBOL = "USDC"

/** The default funding token: USDC when the sale accepts it, else the sale's first token. */
export function defaultPaymentToken(tokens: readonly PaymentToken[]): PaymentToken {
  return tokens.find((t) => t.symbol === DEFAULT_TOKEN_SYMBOL) ?? tokens[0]
}

/** Pick the funding token for this transaction: the caller's choice when it is one of the sale's
 *  registered tokens, else the default. Fails fast on an address the contract would reject anyway
 *  (InvalidPaymentToken). */
export function selectPaymentToken(
  tokens: readonly PaymentToken[],
  requested?: `0x${string}`,
): PaymentToken {
  if (!requested) return defaultPaymentToken(tokens)
  const match = tokens.find((t) => t.address.toLowerCase() === requested.toLowerCase())
  if (!match) {
    throw new Error("Selected token is not accepted by this sale")
  }
  return match
}

/** ERC-20 approve plan covering the amount delta; null = the current allowance already covers it.
 *  resetFirst handles USDT-style approve, which reverts when changing a non-zero allowance - it
 *  must be zeroed first (verified mainnet USDT behavior). */
export function approvalPlan(
  allowance: bigint,
  delta: bigint,
): { resetFirst: boolean; amount: bigint } | null {
  if (delta <= 0n || allowance >= delta) return null
  return { resetFirst: allowance > 0n, amount: delta }
}

// Mainnet tokens with no usable EIP-2612 permit (verified against deployed bytecode); they take
// the approval path. Anything else is probed for nonces() and falls back to approval when absent.
const NO_PERMIT_SYMBOLS = new Set(["USDT"])

async function tokenSupportsPermit(token: PaymentToken, wallet: `0x${string}`): Promise<boolean> {
  if (NO_PERMIT_SYMBOLS.has(token.symbol)) return false
  try {
    await readContract(wagmiConfig, {
      address: token.address,
      abi: erc20Abi,
      functionName: "nonces",
      args: [wallet],
      chainId: SALE_CHAIN.id,
    })
    return true
  } catch {
    return false
  }
}

// The sale's payment tokens are immutable (set at contract init), so read the full list
// (address + symbol + decimals) once per (chain, sale) and cache. Reading paymentTokens() means we
// bid in EXACTLY the tokens the deployed contract accepts - nothing hardcoded to drift out of sync.
const paymentTokensCache = new Map<string, PaymentToken[]>()

export async function resolvePaymentTokens(
  settlementSale: `0x${string}`,
  chainId: number,
): Promise<PaymentToken[]> {
  const key = `${chainId}:${settlementSale}`
  const cached = paymentTokensCache.get(key)
  if (cached) return cached
  // Callers only reach this after the chainId === SALE_CHAIN.id gate, so the reads pin to
  // SALE_CHAIN: a wallet network switch mid-flight cannot route them to another chain's RPC.
  const addresses = await readContract(wagmiConfig, {
    address: settlementSale,
    abi: settlementSaleAbi,
    functionName: "paymentTokens",
    chainId: SALE_CHAIN.id,
  })
  const tokens = await Promise.all(
    addresses.map(async (address) => {
      const [symbol, decimals] = await Promise.all([
        readContract(wagmiConfig, {
          address,
          abi: erc20Abi,
          functionName: "symbol",
          chainId: SALE_CHAIN.id,
        }),
        readContract(wagmiConfig, {
          address,
          abi: erc20Abi,
          functionName: "decimals",
          chainId: SALE_CHAIN.id,
        }),
      ])
      return { address, symbol, decimals: Number(decimals) }
    }),
  )
  assertUniformDecimals(tokens)
  paymentTokensCache.set(key, tokens)
  return tokens
}

type ReplacementReason = "replaced" | "repriced" | "cancelled" | null

/**
 * A wallet "cancel" is a 0-value self-send that mines "success", so a cancellation must read as a
 * failure, not a landed tx. Only "repriced" is provably the SAME call (viem: identical
 * to+value+input, gas-only bump) and stays valid at the mined hash; "replaced" means a DIFFERENT
 * call won the nonce - the receipt in hand is for some other transaction. Shared by the bid and
 * claim paths; returns the user-facing failure line, or null when the receipt is still ours.
 */
export function replacementFailure(reason: ReplacementReason): string | null {
  if (reason === "cancelled") return "You cancelled the transaction."
  if (reason === "replaced") return "The transaction was replaced in your wallet."
  return null
}

/** Decide the bid outcome from the mined receipt + any replacement (see replacementFailure). */
export function interpretBidReceipt(
  receipt: { status: "success" | "reverted"; transactionHash: string },
  replacementReason: ReplacementReason,
): BidResult {
  const replaced = replacementFailure(replacementReason)
  if (replaced) {
    return { status: "reverted", reason: replaced }
  }
  if (receipt.status !== "success") {
    return { status: "reverted", reason: "The bid transaction failed on-chain." }
  }
  return { status: "submitted", txHash: receipt.transactionHash }
}

/** The one receipt wait for every tx this module sends: pins the sale chain and captures a wallet
 *  replacement so no caller can mistake a cancel/foreign tx for its own mined call. */
async function waitWithReplacement(hash: `0x${string}`): Promise<{
  receipt: { status: "success" | "reverted"; transactionHash: string }
  reason: ReplacementReason
}> {
  let reason: ReplacementReason = null
  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: SALE_CHAIN.id,
    onReplaced: (r) => {
      reason = r.reason
    },
  })
  return { receipt, reason }
}

type SalePublicClient = NonNullable<ReturnType<typeof getPublicClient>>

/** Explicit gas with a generous ceiling: wallets (esp. Keplr's EVM path) under-estimate the nested
 *  permit+transferFrom call (EIP-150 63/64 rule). Our own RPC estimate x3 over a floor safely above
 *  the ~393k a first bid measured on Sepolia; unused gas is refunded, so the ceiling is free. */
async function generousGas(
  estimate: (client: SalePublicClient) => Promise<bigint>,
): Promise<bigint> {
  let gas = 600_000n
  try {
    const publicClient = getPublicClient(wagmiConfig, { chainId: SALE_CHAIN.id })
    if (publicClient) {
      const estimated = (await estimate(publicClient)) * 3n
      if (estimated > gas) gas = estimated
    }
  } catch {
    // estimate failed (network/state); keep the floor
  }
  return gas
}

/**
 * Cheap pre-signature guards from data already in hand (the permit + one balance read): reject a
 * doomed bid BEFORE the EIP-2612 wallet popup so no unused approval is signed. Returns a user-facing
 * reason (reusing bidRevertReason's wording), or null to proceed. Permit bounds are enforced only
 * when SET (> 0), with the contract's own values and comparators, so this can only refuse what
 * simulateContract would refuse; a zero bound stays the contract's call ("0 = no limit" unpinned).
 */
export function bidPreflightReason(
  permit: SonarPermitV3,
  bid: { price: bigint; amount: bigint },
  amountDelta: bigint,
  usdcBalance: bigint,
  nowSec: number,
  tokenSymbol = "USDC",
): string | null {
  const expiresAt = Number(permit.ExpiresAt)
  if (expiresAt > 0 && nowSec >= expiresAt) {
    return "Your authorization expired, please try again."
  }
  const minPrice = BigInt(permit.MinPrice)
  const maxPrice = BigInt(permit.MaxPrice)
  if ((minPrice > 0n && bid.price < minPrice) || (maxPrice > 0n && bid.price > maxPrice)) {
    return "Your price is outside the allowed range."
  }
  const minAmount = BigInt(permit.MinAmount)
  const maxAmount = BigInt(permit.MaxAmount)
  if ((minAmount > 0n && bid.amount < minAmount) || (maxAmount > 0n && bid.amount > maxAmount)) {
    return "Your amount is outside the allowed range."
  }
  if (amountDelta > 0n && usdcBalance < amountDelta) {
    return `Insufficient ${tokenSymbol} balance.`
  }
  return null
}

export async function submitBidOnChain(args: OnChainBidArgs): Promise<BidResult> {
  const { params, permit, wallet } = args
  if (!permit?.Signature) {
    return { status: "reverted", reason: "Missing purchase permit." }
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

  let paySymbol = "USDC"
  // Which wallet prompt is open when a rejection lands: every prompt in the flow is a transaction
  // confirmation except the EIP-2612 typed-data signature - the cancel copy must name the right one.
  let walletPrompt: "signature" | "transaction" = "transaction"
  try {
    const purchasePermit = toPurchasePermitV3(permit.PermitJSON)
    const payment = selectPaymentToken(
      await resolvePaymentTokens(contracts.settlementSale, chainId),
      params.token,
    )
    paySymbol = payment.symbol
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
      chainId: SALE_CHAIN.id,
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
            chainId: SALE_CHAIN.id,
          })
        : 0n
    const preflight = bidPreflightReason(
      permit.PermitJSON,
      bid,
      amountDelta,
      usdcBalance,
      Math.floor(Date.now() / 1000),
      payment.symbol,
    )
    if (preflight) {
      return { status: "reverted", reason: preflight }
    }

    // Approval path - tokens without EIP-2612 (e.g. USDT): fund the delta with a plain approve tx
    // (zeroing a leftover allowance first, USDT requirement), then bid via replaceBidWithApproval.
    // The permit path below stays untouched for USDC.
    if (amountDelta > 0n && !(await tokenSupportsPermit(payment, wallet))) {
      const allowance = await readContract(wagmiConfig, {
        address: payment.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [wallet, contracts.settlementSale],
        chainId: SALE_CHAIN.id,
      })
      const plan = approvalPlan(allowance, amountDelta)
      if (plan) {
        args.onStage?.("approving")
        if (plan.resetFirst) {
          const resetHash = await writeContract(wagmiConfig, {
            address: payment.address,
            abi: erc20Abi,
            functionName: "approve",
            args: [contracts.settlementSale, 0n],
            account: wallet,
            chainId: SALE_CHAIN.id,
          })
          const reset = await waitWithReplacement(resetHash)
          const resetFailure = replacementFailure(reset.reason)
          if (resetFailure) {
            return { status: "reverted", reason: resetFailure }
          }
          if (reset.receipt.status !== "success") {
            return { status: "reverted", reason: "The approval transaction failed on-chain." }
          }
        }
        const approveHash = await writeContract(wagmiConfig, {
          address: payment.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [contracts.settlementSale, plan.amount],
          account: wallet,
          chainId: SALE_CHAIN.id,
        })
        const approve = await waitWithReplacement(approveHash)
        const approveFailure = replacementFailure(approve.reason)
        if (approveFailure) {
          return { status: "reverted", reason: approveFailure }
        }
        if (approve.receipt.status !== "success") {
          return { status: "reverted", reason: "The approval transaction failed on-chain." }
        }
      }
      const call = {
        address: contracts.settlementSale,
        abi: settlementSaleAbi,
        functionName: "replaceBidWithApproval",
        args: [payment.address, bid, purchasePermit, permit.Signature as `0x${string}`],
        account: wallet,
        chainId: SALE_CHAIN.id,
      } as const
      await simulateContract(wagmiConfig, call) // pre-flight: surface reverts before the wallet popup
      args.onStage?.("signing")
      const gas = await generousGas((client) => client.estimateContractGas(call))
      const txHash = await writeContract(wagmiConfig, { ...call, gas })
      const wait = await waitWithReplacement(txHash)
      return interpretBidReceipt(wait.receipt, wait.reason)
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
          chainId: SALE_CHAIN.id,
        }),
        readContract(wagmiConfig, {
          address: payment.address,
          abi: erc20Abi,
          functionName: "version",
          chainId: SALE_CHAIN.id,
        }).catch(() => "2"),
        readContract(wagmiConfig, {
          address: payment.address,
          abi: erc20Abi,
          functionName: "nonces",
          args: [wallet],
          chainId: SALE_CHAIN.id,
        }),
      ])
      erc20PermitDeadline = BigInt(Math.floor(Date.now() / 1000) + PERMIT_TTL_S)
      args.onStage?.("approving")
      walletPrompt = "signature"
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
      walletPrompt = "transaction"
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
      chainId: SALE_CHAIN.id,
    } as const

    await simulateContract(wagmiConfig, call) // pre-flight: surface reverts before the wallet popup
    args.onStage?.("signing")
    const gas = await generousGas((client) => client.estimateContractGas(call))
    const txHash = await writeContract(wagmiConfig, { ...call, gas })
    const wait = await waitWithReplacement(txHash)
    return interpretBidReceipt(wait.receipt, wait.reason)
  } catch (err) {
    return {
      status: "reverted",
      reason: bidRevertReason(
        err,
        paySymbol,
        walletPrompt === "transaction" ? "You cancelled the transaction." : undefined,
      ),
    }
  }
}

type TokenAmount = { token: `0x${string}`; amount: bigint }
type WalletTokenState = {
  committedAmountByToken: readonly TokenAmount[]
  acceptedAmountByToken: readonly TokenAmount[]
}

/** True refundable amount in token units: committed minus accepted per token across the entity's
 *  wallets - exactly the contract's _refund() arithmetic, so pro-rata partial refunds for WINNERS
 *  are included (the Sonar-derived settlement can only show those as zero). */
export function refundableUnits(walletStates: readonly WalletTokenState[]): bigint {
  let total = 0n
  for (const w of walletStates) {
    for (const committed of w.committedAmountByToken) {
      const accepted =
        w.acceptedAmountByToken.find((a) => a.token.toLowerCase() === committed.token.toLowerCase())
          ?.amount ?? 0n
      const delta = committed.amount - accepted
      if (delta > 0n) total += delta
    }
  }
  return total
}

export type ClaimGate = {
  /** stage() == Done: the only stage where claimRefund() executes and accepted amounts are final.
   *  false also covers "no contract configured" - the UI must not claim anything either way. */
  done: boolean
  /** The raw on-chain self-serve toggle (only meaningful once done). */
  claimEnabled: boolean
  /** The entity's refund already went out (refunder-role processed or claimed). */
  refunded: boolean
  /** On-chain refundable in USD (1:1 token parity), or null when this wallet holds no on-chain
   *  position or the contract has not reached Done. */
  refundableUsd: number | null
}

/** True only for the contract's own WalletNotInitialized revert - a transient RPC failure must
 *  NOT read as "no position" (that would resolve the gate on wrong data). */
function isWalletNotInitialized(err: unknown): boolean {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError)
    if (revert instanceof ContractFunctionRevertedError) {
      return revert.data?.errorName === "WalletNotInitialized"
    }
  }
  return false
}

/** Read the refund claim gate from the deployed contract (the authoritative source; the
 *  Sonar-derived settlement stays a display estimate, see lib/sale/settlement.ts). Throws on
 *  transient read failures so the query stays unresolved (fail-closed) instead of caching a
 *  gate built on partial data. */
export async function readClaimGate(wallet: `0x${string}`): Promise<ClaimGate> {
  const contracts = saleContractsFor(SALE_CHAIN.id)
  if (!contracts) return { done: false, claimEnabled: false, refunded: false, refundableUsd: null }
  const address = contracts.settlementSale
  const [stage, enabled, walletView] = await Promise.all([
    readContract(wagmiConfig, {
      address,
      abi: settlementSaleAbi,
      functionName: "stage",
      chainId: SALE_CHAIN.id,
    }),
    readContract(wagmiConfig, {
      address,
      abi: settlementSaleAbi,
      functionName: "claimRefundEnabled",
      chainId: SALE_CHAIN.id,
    }),
    readContract(wagmiConfig, {
      address,
      abi: settlementSaleAbi,
      functionName: "walletStatesByAddresses",
      args: [[wallet]],
      chainId: SALE_CHAIN.id,
    }).then(
      ([view]) => view ?? null,
      (err) => {
        if (isWalletNotInitialized(err)) return null // this wallet never committed on-chain
        throw err
      },
    ),
  ])
  const done = stage === SALE_STAGE.done
  if (!done || !walletView) {
    return { done, claimEnabled: enabled, refunded: false, refundableUsd: null }
  }
  const [entity] = await readContract(wagmiConfig, {
    address,
    abi: settlementSaleAbi,
    functionName: "entityStatesByIDs",
    args: [[walletView.entityID]],
    chainId: SALE_CHAIN.id,
  })
  const [token] = await resolvePaymentTokens(address, SALE_CHAIN.id)
  if (!entity || !token) {
    return { done, claimEnabled: enabled, refunded: false, refundableUsd: null }
  }
  return {
    done,
    claimEnabled: enabled,
    refunded: entity.refunded,
    refundableUsd: Number(refundableUnits(entity.walletStates)) / 10 ** token.decimals,
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
      chainId: SALE_CHAIN.id,
    } as const
    await simulateContract(wagmiConfig, call)
    const txHash = await writeContract(wagmiConfig, call)
    // Same wallet-replacement trap as the bid path: a cancel mines "success" as a self-send and a
    // foreign replacement wins the nonce - neither is a claim, so neither may read as "claimed".
    const wait = await waitWithReplacement(txHash)
    const failure = replacementFailure(wait.reason)
    if (failure) {
      return { status: "reverted", reason: failure }
    }
    if (wait.receipt.status !== "success") {
      return { status: "reverted", reason: "The refund transaction failed." }
    }
    // The mined hash, not txHash: a repriced (sped-up) claim mines under a new hash.
    return { status: "claimed", txHash: wait.receipt.transactionHash }
  } catch (err) {
    return {
      status: "reverted",
      reason:
        sharedWalletErrorReason(err, "You cancelled the transaction.") ??
        "Could not claim your refund.",
    }
  }
}
