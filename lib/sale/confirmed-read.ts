"use client"

import { type EntityRead, getEntity, getMyPosition } from "./api"
import { hasBidSeen, hasSonarSeen, markBidSeen } from "./returning"
import type { MyBid } from "./types"

const CONFIRM_TRIES = 2
const CONFIRM_DELAY_MS = 1500

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Re-read a suspect answer a bounded number of times: one transient empty upstream answer must
// not settle as an authoritative "nothing" that only a manual reload would fix.
async function confirmEmpty<T>(
  fetcher: () => Promise<T>,
  suspect: (result: T) => boolean,
  delayMs: number,
): Promise<T> {
  let result = await fetcher()
  for (let tries = 0; suspect(result) && tries < CONFIRM_TRIES; tries++) {
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
  const position = await confirmEmpty(fetcher, (r) => r == null && hasBidSeen(), delayMs)
  if (position != null) {
    markBidSeen()
  }
  return position
}

/** entity read: an empty answer is re-read before being trusted. A no-entity answer is ALWAYS
 *  suspect - it is the ambiguous one (Sonar may still be materializing the entity right after
 *  OAuth, or answering empty transiently) and a false "start your setup" must not stick. A
 *  no-session answer (deterministic, cheap 401s) is only suspect on a browser that has seen an
 *  entity, killing the false sticky "reconnect" without hiding the real one. */
export async function readEntity(
  fetcher: () => Promise<EntityRead> = getEntity,
  delayMs: number = CONFIRM_DELAY_MS,
): Promise<EntityRead> {
  return confirmEmpty(
    fetcher,
    (r) => r.status === "no-entity" || (r.status === "no-session" && hasSonarSeen()),
    delayMs,
  )
}
