// Deterministic in-repo JSON-RPC stub for the sepolia sale chain. Answers exactly the reads the
// bid flow needs (lib/sale/onchain.ts) plus the handful of chain-plumbing calls viem issues around
// them; anything else is a loud "unhandled method" error rather than a silently wrong shape.
import { type Server, createServer } from "node:http"
import type { Hex } from "viem"
import { z } from "zod"
import { SEPOLIA_CHAIN_ID } from "../constants"
import { computeEthCall } from "./calls"

const jsonRpcRequestSchema = z.object({
  jsonrpc: z.string(),
  id: z.union([z.number(), z.string(), z.null()]).optional(),
  method: z.string(),
  params: z.array(z.unknown()).default([]),
})

const ethCallParamsSchema = z.object({
  to: z.string(),
  data: z.string(),
})

/** Narrows a string to 0x-hex after a real regex check (mirrors lib/sale/permit-map.ts's asHex). */
function toHex(value: string, label: string): Hex {
  if (!/^0x[0-9a-fA-F]*$/.test(value)) {
    throw new Error(`rpc-stub: ${label} is not 0x-hex: ${value}`)
  }
  return value as Hex
}

function hexBlockNumber(): Hex {
  return "0x1"
}

/** Minimal viem-formattable block: only the fields the RPC client actually reads are load-bearing. */
function stubBlock(numberHex: Hex): Record<string, unknown> {
  return {
    number: numberHex,
    hash: `0x${"ab".repeat(32)}`,
    parentHash: `0x${"00".repeat(32)}`,
    nonce: "0x0000000000000000",
    sha3Uncles: `0x${"00".repeat(32)}`,
    logsBloom: `0x${"00".repeat(256)}`,
    transactionsRoot: `0x${"00".repeat(32)}`,
    stateRoot: `0x${"00".repeat(32)}`,
    receiptsRoot: `0x${"00".repeat(32)}`,
    miner: "0x0000000000000000000000000000000000000000",
    difficulty: "0x0",
    totalDifficulty: "0x0",
    extraData: "0x",
    size: "0x0",
    gasLimit: "0x1c9c380",
    gasUsed: "0x0",
    timestamp: `0x${Math.floor(Date.now() / 1000).toString(16)}`,
    baseFeePerGas: "0x3b9aca00",
    transactions: [],
    uncles: [],
  }
}

function dispatch(method: string, params: readonly unknown[]): unknown {
  switch (method) {
    case "eth_chainId":
      return `0x${SEPOLIA_CHAIN_ID.toString(16)}`
    case "eth_blockNumber":
      return hexBlockNumber()
    case "eth_getBlockByNumber":
      return stubBlock(hexBlockNumber())
    case "eth_gasPrice":
    case "eth_maxPriorityFeePerGas":
      return "0x3b9aca00" // 1 gwei
    case "eth_getTransactionCount":
      return "0x0"
    case "eth_estimateGas":
      return "0x30d40" // 200,000 - generousGas() floors/multiplies this, exact value is not asserted
    case "eth_call": {
      const { to, data } = ethCallParamsSchema.parse(params[0])
      return computeEthCall(toHex(to, "to"), toHex(data, "data"))
    }
    default:
      throw new Error(`rpc-stub: unhandled method "${method}"`)
  }
}

function jsonRpcErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** Starts the stub on `port`. The app reaches it cross-origin (different port = different
 *  browser origin), so every response needs CORS headers, not just the preflight. */
export function startRpcStub(port: number): Server {
  const server = createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "content-type")
    if (req.method === "OPTIONS") {
      res.writeHead(204)
      res.end()
      return
    }
    const chunks: Buffer[] = []
    req.on("data", (chunk: Buffer) => chunks.push(chunk))
    req.on("end", () => {
      res.setHeader("content-type", "application/json")
      let parsedBody: unknown
      try {
        parsedBody = JSON.parse(Buffer.concat(chunks).toString("utf8"))
      } catch (err) {
        res.writeHead(400)
        res.end(JSON.stringify({ error: jsonRpcErrorMessage(err) }))
        return
      }
      const requests = Array.isArray(parsedBody) ? parsedBody : [parsedBody]
      const responses = requests.map((raw) => {
        const request = jsonRpcRequestSchema.parse(raw)
        try {
          const result = dispatch(request.method, request.params)
          return { jsonrpc: "2.0", id: request.id ?? null, result }
        } catch (err) {
          return {
            jsonrpc: "2.0",
            id: request.id ?? null,
            error: { code: -32000, message: jsonRpcErrorMessage(err) },
          }
        }
      })
      res.writeHead(200)
      res.end(JSON.stringify(Array.isArray(parsedBody) ? responses : responses[0]))
    })
  })
  server.listen(port)
  return server
}
