import type { Page } from "@playwright/test"

export type MockWalletInfo = { uuid: string; name: string; icon: string; rdns: string }

type BindingResponse =
  | { ok: true; result: unknown; events?: readonly (readonly [string, unknown])[] }
  | { ok: false; code: number; message: string }

// Populated by injectMockWallet (below) inside the page. Every installed identity shares this one
// binding (wagmi's default EIP-6963 discovery needs no other app hook), keyed by uuid so several
// installMockWallet calls on the same page stay independent.
declare global {
  interface Window {
    __mockWalletCall?: (uuid: string, method: string, params: unknown[]) => Promise<BindingResponse>
    __mockWalletEmit?: (uuid: string, event: string, data: unknown) => void
    __mockWallets?: Map<string, { emit: (event: string, data: unknown) => void }>
  }
}

type InjectArgs = { info: MockWalletInfo }

// Runs inside the page (Playwright serializes this function verbatim via addInitScript): announces
// an EIP-6963 provider identity whose every request forwards to the node-side MockWalletHandler
// through window.__mockWalletCall (installed once by the `wallet` fixture in fixtures.ts).
function injectMockWallet(args: InjectArgs): void {
  const { info } = args
  const listeners = new Map<string, Set<(data: unknown) => void>>()

  function emit(event: string, data: unknown): void {
    for (const cb of listeners.get(event) ?? []) cb(data)
  }

  const provider = {
    isMockWallet: true as const,
    async request({ method, params }: { method: string; params?: unknown[] }): Promise<unknown> {
      const call = window.__mockWalletCall
      if (!call) throw new Error("mock wallet binding is not installed")
      const res = await call(info.uuid, method, params ?? [])
      if (!res.ok) {
        throw Object.assign(new Error(res.message), { code: res.code })
      }
      if (method === "wallet_switchEthereumChain" && res.events) {
        for (const [event, data] of res.events) emit(event, data)
      }
      return res.result
    },
    on(event: string, cb: (data: unknown) => void): void {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event)?.add(cb)
    },
    removeListener(event: string, cb: (data: unknown) => void): void {
      listeners.get(event)?.delete(cb)
    },
  }

  window.__mockWallets ??= new Map()
  window.__mockWallets.set(info.uuid, { emit })
  window.__mockWalletEmit ??= (uuid, event, data) => {
    window.__mockWallets?.get(uuid)?.emit(event, data)
  }

  function announce(): void {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", { detail: Object.freeze({ info, provider }) }),
    )
  }
  // Immediately (a wallet already "installed" when the page loads) and on every future request
  // (wagmi re-requests post-hydration).
  window.addEventListener("eip6963:requestProvider", announce)
  announce()
}

/** Installs an EIP-6963 mock wallet identity on `page`. Must run before `page.goto` so the first
 *  announce fires pre-hydration (init scripts re-run on every navigation, so re-announcing across
 *  a reload is automatic too). */
export async function announceMockWallet(page: Page, info: MockWalletInfo): Promise<void> {
  await page.addInitScript(injectMockWallet, { info })
}

/** Simulates the wallet pushing an event on its own (e.g. an out-of-band account switch). */
export async function emitMockWalletEvent(
  page: Page,
  uuid: string,
  event: string,
  data: unknown,
): Promise<void> {
  await page.evaluate(({ uuid, event, data }) => window.__mockWalletEmit?.(uuid, event, data), {
    uuid,
    event,
    data,
  })
}
