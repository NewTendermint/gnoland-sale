"use client"

// Survives the unmount when a wallet disconnects mid-bid. Session-scoped, keyed
// to the wallet so another account cannot inherit it. Amount only: the price
// re-seeds from the live floor.
const BID_DRAFT_KEY = "gnot:bid-draft"
const BID_DRAFT_TTL_MS = 10 * 60 * 1000

export function readBidDraft(address: string): string | null {
  try {
    const raw = window.sessionStorage.getItem(BID_DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as { amount?: unknown; ts?: unknown; address?: unknown }
    if (typeof draft.amount !== "string" || typeof draft.ts !== "number") return null
    if (draft.address !== address.toLowerCase()) return null
    return Date.now() - draft.ts > BID_DRAFT_TTL_MS ? null : draft.amount
  } catch {
    return null // private mode / storage disabled / corrupt entry
  }
}

export function writeBidDraft(amount: string, address: string): void {
  try {
    window.sessionStorage.setItem(
      BID_DRAFT_KEY,
      JSON.stringify({ amount, address: address.toLowerCase(), ts: Date.now() }),
    )
  } catch {
    // private mode / storage disabled -> the draft just does not survive the unmount
  }
}

export function clearBidDraft(): void {
  try {
    window.sessionStorage.removeItem(BID_DRAFT_KEY)
  } catch {
    // ignore: nothing to clear if storage is unavailable
  }
}
