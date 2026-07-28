import "server-only"
import { http, createPublicClient, fallback } from "viem"
import { SALE_CHAIN } from "./contracts"
import { rpcUrlsFor } from "./rpc"

// Server-side (Node) read client, memoized per warm instance. Not lib/sale/onchain.ts, which is
// "use client" and pulls in wagmiConfig + the wallet connectors. Keyed RPCs first, viem's public
// default last, so a missing key degrades rather than fails.
let client: ReturnType<typeof createPublicClient> | null = null

export function publicClient() {
  if (!client) {
    client = createPublicClient({
      chain: SALE_CHAIN,
      transport: fallback([...rpcUrlsFor(SALE_CHAIN.id).map((url) => http(url)), http()]),
    })
  }
  return client
}
