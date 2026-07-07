import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { type ReactNode, createElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useMyBid } from "../../../lib/sale/hooks"
import type { MyBid } from "../../../lib/sale/types"

// useAccount is the only wagmi surface useMyBid touches; drive it per test.
const accountState: { isConnected: boolean; address: `0x${string}` | undefined } = {
  isConnected: true,
  address: "0x1111111111111111111111111111111111111111",
}
vi.mock("wagmi", () => ({
  useAccount: () => ({ ...accountState }),
}))

const readMyPosition = vi.fn<() => Promise<MyBid>>()
vi.mock("../../../lib/sale/confirmed-read", () => ({
  readMyPosition: () => readMyPosition(),
  readEntity: vi.fn(),
}))

// onchain pulls the real wagmiConfig (WalletConnect connectors) at module load - stub it out.
vi.mock("../../../lib/sale/onchain", () => ({
  claimRefundOnChain: vi.fn(),
  resolvePaymentTokens: vi.fn(),
  submitBidOnChain: vi.fn(),
}))

const BID: MyBid = { priceUsd: 0.09, committedUsd: 500, lockup: false }

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, wrapper }
}

beforeEach(() => {
  accountState.isConnected = true
  accountState.address = "0x1111111111111111111111111111111111111111"
  readMyPosition.mockReset()
  readMyPosition.mockResolvedValue(BID)
  window.localStorage.clear()
})

describe("useMyBid on wallet disconnect (G-G)", () => {
  it("clears the cached position when the wallet disconnects", async () => {
    const { queryClient, wrapper } = setup()
    const { result, rerender } = renderHook(() => useMyBid(), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual(BID))

    accountState.isConnected = false
    accountState.address = undefined
    rerender()

    // The stale position must not survive the disconnect (journey would keep "Raise bid").
    await waitFor(() => expect(queryClient.getQueryData(["sale", "my-bid"])).toBeUndefined())
    await waitFor(() => expect(result.current.data).toBeUndefined())
  })

  it("keeps the position while the wallet stays connected", async () => {
    const { wrapper } = setup()
    const { result, rerender } = renderHook(() => useMyBid(), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual(BID))

    rerender()

    expect(result.current.data).toEqual(BID)
  })

  it("refetches a fresh position on reconnect instead of reusing the cleared one", async () => {
    const { wrapper } = setup()
    const { result, rerender } = renderHook(() => useMyBid(), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual(BID))

    accountState.isConnected = false
    accountState.address = undefined
    rerender()
    await waitFor(() => expect(result.current.data).toBeUndefined())

    const NEXT: MyBid = { priceUsd: 0.12, committedUsd: 800, lockup: false }
    readMyPosition.mockResolvedValue(NEXT)
    accountState.isConnected = true
    accountState.address = "0x2222222222222222222222222222222222222222"
    rerender()

    await waitFor(() => expect(result.current.data).toEqual(NEXT))
  })
})
