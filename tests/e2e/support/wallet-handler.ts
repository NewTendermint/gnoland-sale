// Node-side EIP-1193 dispatcher behind the mock wallet's window.__mockWalletCall binding
// (see eip6963.ts). Signs real EIP-2612 typed data with a viem LocalAccount so the app's
// signature round-trips genuinely verify; every request is logged so specs can assert on the
// exact shape the app sent, independent of whether the wallet then approves or rejects it.
import type { Hex } from "viem"
import { type LocalAccount, generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { z } from "zod"

export type WalletBehavior = "approve" | "reject"

export type WalletOptions = {
  chainId?: number
  requestAccountsBehavior?: WalletBehavior
  /** Artificial delay before eth_requestAccounts resolves, to observe the picker's pending state. */
  requestAccountsDelayMs?: number
  switchChainBehavior?: WalletBehavior
  signTypedDataBehavior?: WalletBehavior
  sendTransactionBehavior?: WalletBehavior
}

export type TypedDataRequest = {
  domain: Record<string, unknown>
  types: Record<string, { name: string; type: string }[]>
  primaryType: string
  message: Record<string, unknown>
  /** Set only when signTypedDataBehavior approved the request. */
  signature?: Hex
}

export type SendTransactionRequest = {
  to: Hex
  data: Hex
  from?: Hex
}

type BindingResponse =
  | { ok: true; result: unknown; events?: readonly (readonly [string, unknown])[] }
  | { ok: false; code: number; message: string }

// A regex-validated transform (asHex-style guard, matches lib/sale/permit-map.ts's convention)
// is the one legitimate place to assert a string into a template-literal hex type.
const hexDataSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]*$/)
  .transform((v) => v as Hex)

const switchChainParamsSchema = z.tuple([z.object({ chainId: hexDataSchema })])
const signTypedDataParamsSchema = z.tuple([hexDataSchema, z.string()])
const sendTransactionParamsSchema = z.tuple([
  z.object({ to: hexDataSchema, data: hexDataSchema, from: hexDataSchema.optional() }),
])
const typedDataPayloadSchema = z.object({
  domain: z.record(z.string(), z.unknown()),
  types: z.record(z.string(), z.array(z.object({ name: z.string(), type: z.string() }))),
  primaryType: z.string(),
  message: z.record(z.string(), z.unknown()),
})

export class MockWalletHandler {
  readonly address: Hex
  private chainId: number
  private accounts: Hex[]
  private readonly account: LocalAccount
  private readonly requestAccountsBehavior: WalletBehavior
  private readonly requestAccountsDelayMs: number
  private readonly switchChainBehavior: WalletBehavior
  private readonly signTypedDataBehavior: WalletBehavior
  private readonly sendTransactionBehavior: WalletBehavior
  private readonly typedDataLog: TypedDataRequest[] = []
  private readonly sendTransactionLog: SendTransactionRequest[] = []
  private requestAccountsCount = 0
  // Real wallets answer eth_accounts with [] until the origin is authorized via a successful
  // eth_requestAccounts. Answering eagerly made wagmi's mount-time reconnect probe treat the
  // wallet as previously-connected and AUTO-CONNECT past the picker - a hydration race that
  // intermittently removed the Connect button the specs were about to click. Node-side state,
  // so an authorized wallet correctly survives reloads (the silent-reconnect contract, WAL-12).
  private authorized = false

  constructor(opts: WalletOptions = {}) {
    // A fresh key per install: the server's per-wallet permit dedup (5s window) would otherwise
    // refuse permits across the two bid specs AND across Playwright retries of the same test.
    this.account = privateKeyToAccount(generatePrivateKey())
    this.address = this.account.address
    this.accounts = [this.address]
    this.chainId = opts.chainId ?? 1
    this.requestAccountsBehavior = opts.requestAccountsBehavior ?? "approve"
    this.requestAccountsDelayMs = opts.requestAccountsDelayMs ?? 0
    this.switchChainBehavior = opts.switchChainBehavior ?? "approve"
    this.signTypedDataBehavior = opts.signTypedDataBehavior ?? "approve"
    this.sendTransactionBehavior = opts.sendTransactionBehavior ?? "reject"
  }

  typedDataRequests(): readonly TypedDataRequest[] {
    return this.typedDataLog
  }

  /** How many times the app ASKED for a connection (eth_requestAccounts, the prompting call) -
   *  distinct from eth_accounts, the silent read a reconnect is supposed to use. */
  requestAccountsCalls(): number {
    return this.requestAccountsCount
  }

  sendTransactionRequests(): readonly SendTransactionRequest[] {
    return this.sendTransactionLog
  }

  setChainId(chainId: number): void {
    this.chainId = chainId
  }

  /** Updates the accounts eth_accounts/eth_requestAccounts answer with (wagmi re-queries this on
   *  an accountsChanged event rather than trusting the event payload alone). */
  setAccounts(accounts: Hex[]): void {
    this.accounts = accounts
  }

  async handle(method: string, params: unknown[]): Promise<BindingResponse> {
    switch (method) {
      case "eth_requestAccounts": {
        this.requestAccountsCount += 1
        if (this.requestAccountsDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.requestAccountsDelayMs))
        }
        if (this.requestAccountsBehavior === "reject") {
          return { ok: false, code: 4001, message: "User rejected the request." }
        }
        this.authorized = true
        return { ok: true, result: this.accounts }
      }
      case "eth_accounts":
        return { ok: true, result: this.authorized ? this.accounts : [] }
      case "eth_chainId":
        return { ok: true, result: `0x${this.chainId.toString(16)}` }
      case "wallet_switchEthereumChain": {
        if (this.switchChainBehavior === "reject") {
          return { ok: false, code: 4001, message: "User rejected the request." }
        }
        const [{ chainId }] = switchChainParamsSchema.parse(params)
        this.chainId = Number.parseInt(chainId, 16)
        return { ok: true, result: null, events: [["chainChanged", chainId]] }
      }
      case "eth_signTypedData_v4": {
        const [, payload] = signTypedDataParamsSchema.parse(params)
        const typedData = typedDataPayloadSchema.parse(JSON.parse(payload))
        if (this.signTypedDataBehavior === "reject") {
          this.typedDataLog.push(typedData)
          return { ok: false, code: 4001, message: "User rejected the request." }
        }
        const signature = await this.account.signTypedData(typedData)
        this.typedDataLog.push({ ...typedData, signature })
        return { ok: true, result: signature }
      }
      case "eth_sendTransaction": {
        const [tx] = sendTransactionParamsSchema.parse(params)
        this.sendTransactionLog.push(tx)
        if (this.sendTransactionBehavior === "reject") {
          return { ok: false, code: 4001, message: "User rejected the transaction." }
        }
        return { ok: true, result: `0x${"11".repeat(32)}` }
      }
      default:
        return { ok: false, code: 4200, message: `Unsupported method: ${method}` }
    }
  }
}
