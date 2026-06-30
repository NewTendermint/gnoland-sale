/**
 * Read-only on-chain probe of a Sonar SettlementSale contract and its payment
 * token. Use it to VERIFY the sale config we wire against (sandbox today,
 * mainnet at launch) straight from the source of truth - the deployed bytecode -
 * instead of trusting the dashboard or memory.
 *
 * It reads the same value from SEVERAL independent RPCs and fails loudly if they
 * disagree, so a single flaky/forked endpoint cannot mislead us.
 *
 * Usage:
 *   node scripts/probe-sale.mjs [saleAddress] [rpc1,rpc2,...]
 *   SALE_ADDRESS=0x... SALE_RPCS=https://a,https://b node scripts/probe-sale.mjs
 *
 * Defaults target the Sepolia sandbox sale. For PROD: pass the mainnet contract
 * address + mainnet RPCs - paymentTokens() will then return mainnet USDC, etc.
 *
 * Read-only by construction: only `view` calls, never a transaction.
 */

import {
  http,
  createPublicClient,
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
  toBytes,
} from "viem"

const SALE = (
  process.argv[2] ||
  process.env.SALE_ADDRESS ||
  "0xc600cAF84C3654B572BA84c5bAC3D75c3dA2645A"
).trim()
const RPCS = (
  process.argv[3] ||
  process.env.SALE_RPCS ||
  [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://rpc.sepolia.org",
    "https://1rpc.io/sepolia",
  ].join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const STAGES = ["PreOpen", "Commitment", "Cancellation", "Settlement", "Done"]

const saleAbi = [
  {
    name: "saleUUID",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes16" }],
  },
  {
    name: "stage",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "claimRefundEnabled",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
  {
    name: "paymentTokens",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
]
const erc20Abi = [
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "version",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "DOMAIN_SEPARATOR",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32" }],
  },
]

const DOMAIN_TYPEHASH = keccak256(
  toBytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
)

/** Recompute the EIP-712 domain separator for a (name, version) guess. */
function domainSeparator(name, version, chainId, verifyingContract) {
  return keccak256(
    encodeAbiParameters(parseAbiParameters("bytes32, bytes32, bytes32, uint256, address"), [
      DOMAIN_TYPEHASH,
      keccak256(toBytes(name)),
      keccak256(toBytes(version)),
      BigInt(chainId),
      verifyingContract,
    ]),
  )
}

async function tryRead(client, address, abi, functionName) {
  try {
    return await client.readContract({ address, abi, functionName })
  } catch (e) {
    return { __error: e.shortMessage || e.message }
  }
}

/** Find the (name, version) whose recomputed separator matches the on-chain one. */
async function resolvePermitDomain(client, token, chainId, name) {
  const onchain = await tryRead(client, token, erc20Abi, "DOMAIN_SEPARATOR")
  if (typeof onchain !== "string") return { matched: null, note: "no DOMAIN_SEPARATOR()" }
  const ver = await tryRead(client, token, erc20Abi, "version")
  const versions = [...new Set([typeof ver === "string" ? ver : null, "2", "1"].filter(Boolean))]
  const names = [...new Set([name, "USD Coin", "USDC"].filter(Boolean))]
  for (const n of names) {
    for (const v of versions) {
      if (domainSeparator(n, v, chainId, token) === onchain)
        return { matched: { name: n, version: v }, onchain }
    }
  }
  return { matched: null, onchain, note: "no (name,version) candidate matched", versionFn: ver }
}

async function probe(rpc) {
  const client = createPublicClient({ transport: http(rpc) })
  const chainId = await client.getChainId()
  const saleUUID = await tryRead(client, SALE, saleAbi, "saleUUID")
  const stage = await tryRead(client, SALE, saleAbi, "stage")
  const claimRefundEnabled = await tryRead(client, SALE, saleAbi, "claimRefundEnabled")
  const paymentTokens = await tryRead(client, SALE, saleAbi, "paymentTokens")

  const tokens = []
  if (Array.isArray(paymentTokens)) {
    for (const t of paymentTokens) {
      const symbol = await tryRead(client, t, erc20Abi, "symbol")
      const name = await tryRead(client, t, erc20Abi, "name")
      const decimals = await tryRead(client, t, erc20Abi, "decimals")
      const permitDomain = await resolvePermitDomain(
        client,
        t,
        chainId,
        typeof name === "string" ? name : "",
      )
      tokens.push({ address: t, symbol, name, decimals: String(decimals), permitDomain })
    }
  }
  return {
    chainId: String(chainId),
    saleUUID,
    stage:
      typeof stage === "number" || typeof stage === "bigint"
        ? `${stage} (${STAGES[Number(stage)] ?? "?"})`
        : stage,
    claimRefundEnabled,
    paymentTokens,
    tokens,
  }
}

const jsonReplacer = (_k, v) => (typeof v === "bigint" ? String(v) : v)

console.info(`Probing SettlementSale ${SALE}`)
console.info(`Across ${RPCS.length} RPC(s): ${RPCS.join(", ")}\n`)

const results = []
for (const rpc of RPCS) {
  try {
    const r = await probe(rpc)
    results.push({ rpc, r })
    console.info(`--- ${rpc} ---`)
    console.info(JSON.stringify(r, jsonReplacer, 2), "\n")
  } catch (e) {
    console.error(`--- ${rpc} FAILED: ${e.shortMessage || e.message}\n`)
  }
}

// Cross-RPC consistency: every successful RPC must agree on the key fields.
if (results.length > 1) {
  const key = (r) =>
    JSON.stringify(
      { s: r.saleUUID, st: r.stage, c: r.claimRefundEnabled, p: r.paymentTokens },
      jsonReplacer,
    )
  const keys = new Set(results.map((x) => key(x.r)))
  console.info(
    keys.size === 1
      ? "CONSISTENT: all RPCs agree on saleUUID/stage/claimRefundEnabled/paymentTokens."
      : "MISMATCH: RPCs disagree - do NOT trust these reads, investigate.",
  )
} else {
  console.info("Only one RPC succeeded - cross-check NOT performed.")
}
