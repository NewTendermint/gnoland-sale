"use client"

import { getEntity, getMyPosition } from "./api"
import { hasBidSeen, hasSonarSeen, markBidSeen } from "./returning"
import type { EntitySnapshot, MyBid } from "./types"

const CONFIRM_TRIES = 2
const CONFIRM_DELAY_MS = 1500

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Re-read a null a bounded number of times while it looks suspect: one transient empty upstream
// answer must not settle as an authoritative "nothing" that only a manual reload would fix.
async function confirmNull<T>(
  fetcher: () => Promise<T | null>,
  suspect: () => boolean,
  delayMs: number,
): Promise<T | null> {
  let result = await fetcher()
  for (let tries = 0; result == null && suspect() && tries < CONFIRM_TRIES; tries++) {
    await wait(delayMs)
    result = await fetcher()
  }
  return result
}

/** my-position read: bids are irrevocable while the sale runs, so a null on a browser that has
 *  seen one is transient noise - confirm before trusting it. Bounded because the flag can belong
 *  to another account on this browser. */
export async function readMyPosition(
  fetcher: () => Promise<MyBid> = getMyPosition,
  delayMs: number = CONFIRM_DELAY_MS,
): Promise<MyBid> {
  const position = await confirmNull(fetcher, hasBidSeen, delayMs)
  if (position != null) {
    markBidSeen()
  }
  return position
}

/** entity read: a browser that had a Sonar entity reading null is either a genuinely expired
 *  session (deterministic, cheap 401s - the reconnect prompt just lands a couple seconds later)
 *  or transient upstream noise (a 404 from an empty Sonar answer) - confirming kills the false
 *  sticky "reconnect" without hiding the real one. */
export async function readEntity(
  fetcher: () => Promise<EntitySnapshot | null> = getEntity,
  delayMs: number = CONFIRM_DELAY_MS,
): Promise<EntitySnapshot | null> {
  return confirmNull(fetcher, hasSonarSeen, delayMs)
}
