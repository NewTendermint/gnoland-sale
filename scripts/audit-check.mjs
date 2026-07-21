import { execFileSync } from "node:child_process"

// Dependency-audit gate. Fails on high/critical advisories in production dependencies, exactly
// like `npm audit --audit-level=high --omit=dev`, EXCEPT for an explicit allowlist of advisory
// ids. Everything not listed still fails the build, so the gate stays strict.
//
// Allowlisted here: transitive axios advisories reachable ONLY through the Coinbase wallet SDK
// (@wagmi/connectors -> @base-org/account -> @coinbase/cdp-sdk -> axios). axios is that SDK's
// HTTP client, not a module this app calls directly, and the advisories require attacker
// control over axios config/proxy/prototype, which this path does not expose. Tracked for
// removal once the wallet SDK ships a patched axios upstream. A NEW advisory id (not below)
// still fails the gate, on purpose.
const ALLOWLIST = new Set([
  "GHSA-42h9-826w-cgv3",
  "GHSA-xj6q-8x83-jv6g",
  "GHSA-pmv8-rq9r-6j72",
  "GHSA-jqh4-m9w3-8hp9",
  "GHSA-mmx7-hfxf-jppx",
  "GHSA-f4gw-2p7v-4548",
  "GHSA-gcfj-64vw-6mp9",
  "GHSA-hcpx-6fm6-wx23",
  "GHSA-7q8q-rj6j-mhjq",
  "GHSA-mwf2-3pr3-8698",
])
const BLOCKING = new Set(["high", "critical"])

function auditReport() {
  try {
    return execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8" })
  } catch (err) {
    // npm audit exits non-zero whenever advisories exist; the JSON report is still on stdout.
    if (typeof err.stdout === "string" && err.stdout.length > 0) return err.stdout
    throw err
  }
}

const report = JSON.parse(auditReport())
// One entry per offending advisory id, deduped across the packages that inherit it.
const offenders = new Map()
for (const [pkg, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  for (const via of vuln.via ?? []) {
    // String `via` entries are just parent package names; only objects carry the advisory.
    if (typeof via !== "object" || !BLOCKING.has(via.severity)) continue
    const id = String(via.url ?? "")
      .split("/")
      .pop()
    if (!id || ALLOWLIST.has(id)) continue
    offenders.set(id, `${pkg}: ${via.severity} ${id} - ${via.title ?? "(no title)"}`)
  }
}

if (offenders.size > 0) {
  console.error("Dependency audit failed on high/critical advisories that are not allowlisted:")
  for (const line of offenders.values()) console.error(`  ${line}`)
  console.error("\nReview the advisory, then upgrade the dependency or add the id to the")
  console.error("allowlist in scripts/audit-check.mjs with a justification.")
  process.exit(1)
}

console.info(
  `Dependency audit clean: no non-allowlisted high/critical advisories (${ALLOWLIST.size} tracked exceptions).`,
)
