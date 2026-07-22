"use client"

import { track, walletConnectedEvent } from "@/lib/analytics/track"
import { useAccountEffect } from "wagmi"

// Provider-level wallet telemetry: a render-free listener for connect/disconnect transitions.
// It lives here rather than in the connect UI because a successful connect immediately unmounts
// that UI, and a mutation callback attached to an unmounting component is dropped before it can
// fire - so the connect-success signal was silently lost. useAccountEffect binds to the
// app-lifetime account observer, so it always fires exactly once per transition and covers every
// connect surface without per-call wiring.
export function WalletTelemetry() {
  useAccountEffect({
    onConnect: (data) => {
      const ev = walletConnectedEvent(data)
      if (ev) track(ev.event, ev.metadata)
    },
    onDisconnect: () => track("wallet_disconnected"),
  })
  return null
}
