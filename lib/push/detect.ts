// Pure outbid detection for the cron. A bid is "outbid" once the clearing price passes its limit.
// Notify only on the winning -> outbid transition (debounced via lastStatus); record any status
// change so a later raise re-arms a future alert.
export type DetectSub = { endpoint: string; bidLimitUsd: number; lastStatus: string }

export type Detection = {
  toNotify: string[]
  statusUpdates: { endpoint: string; status: "winning" | "outbid" }[]
}

/** The one winning/outbid rule, shared by cron detection and subscribe-time seeding so the two
 *  classifications can never drift apart (at-clearing counts as winning). */
export function classifyBid(bidLimitUsd: number, clearingPriceUsd: number): "winning" | "outbid" {
  return bidLimitUsd >= clearingPriceUsd ? "winning" : "outbid"
}

export function detectTransitions(subs: DetectSub[], clearingPriceUsd: number): Detection {
  const toNotify: string[] = []
  const statusUpdates: { endpoint: string; status: "winning" | "outbid" }[] = []
  for (const s of subs) {
    const status = classifyBid(s.bidLimitUsd, clearingPriceUsd)
    if (status !== s.lastStatus) statusUpdates.push({ endpoint: s.endpoint, status })
    if (status === "outbid" && s.lastStatus === "winning") toNotify.push(s.endpoint)
  }
  return { toNotify, statusUpdates }
}
