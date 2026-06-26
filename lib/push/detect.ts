// Pure outbid detection for the cron. A bid is "outbid" once the clearing price passes its limit.
// We notify only on the winning -> outbid transition (debounced via the stored lastStatus), and
// record any status change so a later raise (limit back above clearing) re-arms a future alert.
export type DetectSub = { endpoint: string; bidLimitUsd: number; lastStatus: string }

export type Detection = {
  toNotify: string[]
  statusUpdates: { endpoint: string; status: "winning" | "outbid" }[]
}

export function detectTransitions(subs: DetectSub[], clearingPriceUsd: number): Detection {
  const toNotify: string[] = []
  const statusUpdates: { endpoint: string; status: "winning" | "outbid" }[] = []
  for (const s of subs) {
    const status = s.bidLimitUsd >= clearingPriceUsd ? "winning" : "outbid"
    if (status !== s.lastStatus) statusUpdates.push({ endpoint: s.endpoint, status })
    if (status === "outbid" && s.lastStatus === "winning") toNotify.push(s.endpoint)
  }
  return { toNotify, statusUpdates }
}
