/**
 * Build-time guard: fail if any server-only secret name leaks into the
 * client bundle. This protects against accidental `process.env.SECRET_*`
 * usage in client components or in code paths that bundle for the browser.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * Names that must never appear in built static/client output.
 * Server-only secrets per spec §4.2 (data minimization + non-reconstructability).
 *
 * Patterns are anchored with `\b` (word boundaries) so a forbidden name
 * matches only as a standalone token. This avoids false positives when a
 * framework's internal env var ends with the same suffix
 * (e.g. Next.js's `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`).
 */
const FORBIDDEN_PATTERNS = [
  /\bSONAR_CLIENT_UUID\b/,
  /\bSONAR_REDIRECT_URI\b/,
  /\bSONAR_SALE_UUID\b/,
  /\bSONAR_API_BASE_URL\b/,
  /\bENCRYPTION_KEY\b/,
  /\bIP_HMAC_PEPPER\b/,
  /\bSESSION_PASSWORD\b/,
  /\bDATABASE_URL\b/,
  /\bNETLIFY_BLOBS_TOKEN\b/,
]

/**
 * Client output only. .next/static is what ships to the browser, so a forbidden
 * name here means client code is touching a server secret - the real leak this
 * guards (spec §4.2, "client output").
 *
 * We deliberately do NOT scan .next/server: server code legitimately reads these
 * env vars (the zod env-validation schema keys + `process.env.X` access compile
 * to those names), so name-matching server chunks only yields false positives and
 * adds no client-leak protection. A name reaching .next/static is the signal that
 * matters; a wrong "use client" boundary lands the offending code there too.
 */
const SCAN_ROOTS = [".next/static"]

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

let failed = false
for (const root of SCAN_ROOTS) {
  if (!existsSync(root)) {
    console.error(`Build output missing: ${root} - run 'npm run build' first.`)
    process.exit(2)
  }
  for (const file of walk(root)) {
    // Include .json: app-router can emit RSC/manifest JSON into static output, and
    // a secret name serialized there must not slip past this gate.
    if (!/\.(js|mjs|json|html)$/.test(file)) continue
    const content = readFileSync(file, "utf8")
    for (const pat of FORBIDDEN_PATTERNS) {
      if (pat.test(content)) {
        console.error(`SECRET LEAK: ${pat} found in ${file}`)
        failed = true
      }
    }
  }
}

if (failed) {
  console.error("Bundle secret scan FAILED - see matches above.")
  process.exit(1)
}
console.info("No secret leaks detected in build output. ✓")
