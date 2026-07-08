import { test as base } from "@playwright/test"
import type { Hex } from "viem"
import { type MockWalletInfo, announceMockWallet, emitMockWalletEvent } from "./support/eip6963"
import { sonarLogin } from "./support/sonar"
import { MockWalletHandler, type WalletOptions } from "./support/wallet-handler"

export type InstallWalletOptions = WalletOptions & { info: MockWalletInfo }

function isHexAddressArray(value: unknown): value is Hex[] {
  return (
    Array.isArray(value) &&
    value.every((v) => typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v))
  )
}

export type WalletFixture = {
  /** Installs an EIP-6963 mock wallet identity; call before `page.goto`. */
  install(opts: InstallWalletOptions): Promise<MockWalletHandler>
  /** Pushes a wallet-initiated event (e.g. accountsChanged) for an already-installed wallet. */
  emit(uuid: string, event: string, data: unknown): Promise<void>
}

type Fixtures = {
  wallet: WalletFixture
  sonar: { login(): Promise<void> }
}

export const test = base.extend<Fixtures>({
  // Hermeticity guard: the app's RPC transport falls back to a public chain RPC when a call
  // errors (app/(layout)/web3.ts), so a stub gap would silently run reads against the REAL
  // chain instead of failing the test. Abort anything that isn't the local app or the stub.
  page: async ({ page }, use) => {
    await page.route(
      (url) => url.hostname !== "127.0.0.1" && url.hostname !== "localhost",
      (route) => route.abort(),
    )
    await use(page)
  },
  wallet: async ({ page }, use) => {
    const handlers = new Map<string, MockWalletHandler>()
    await page.exposeFunction(
      "__mockWalletCall",
      async (uuid: string, method: string, params: unknown[]) => {
        const handler = handlers.get(uuid)
        if (!handler) {
          return { ok: false, code: 4900, message: `unknown mock wallet uuid ${uuid}` }
        }
        return handler.handle(method, params)
      },
    )
    await use({
      install: async (opts) => {
        const handler = new MockWalletHandler(opts)
        handlers.set(opts.info.uuid, handler)
        await announceMockWallet(page, opts.info)
        return handler
      },
      emit: async (uuid, event, data) => {
        // wagmi re-queries eth_accounts on accountsChanged rather than trusting the event payload
        // alone, so the node-side handler's own state must move too, not just the browser push.
        if (event === "accountsChanged" && isHexAddressArray(data)) {
          handlers.get(uuid)?.setAccounts(data)
        }
        await emitMockWalletEvent(page, uuid, event, data)
      },
    })
  },
  sonar: async ({ page }, use) => {
    await use({ login: () => sonarLogin(page) })
  },
})

export { expect } from "@playwright/test"
