import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Security headers + Content-Security-Policy, split in two (decision recorded in
 * issue #14, "CSP enforce" under Optional):
 *
 * ENFORCED - the injection-hardening directives no page behavior can trip (no <base>,
 * no native form posts, no plugins, and framing is already denied by X-Frame-Options).
 * Verified empirically: zero violations across load + funnel interactions.
 *
 * REPORT-ONLY - the strict script policy + the wallet-stack allowlist. The page is
 * statically rendered, so the nonce cannot reach the HTML's own script tags and every
 * self-hosted chunk reports under strict-dynamic: these reports are aspirational noise,
 * NOT enforce candidates. Before enforcing connect-src/frame-src, validate the wallet
 * allowlist (WalletConnect relays over wss, the Ethereum RPC, Coinbase) with a real
 * wallet journey on a preview.
 *
 * Chain RPC + WalletConnect/Coinbase endpoints are the moving parts of connect-src;
 * everything else is self. No analytics wired yet (add its hosts here when it is).
 */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())

  // Both policies report to /api/csp-report: report-uri for Firefox/Safari, report-to (wired to
  // the Reporting-Endpoints header below) for Chromium. Without these the Report-Only policy only
  // ever reached the local DevTools console - zero field data.
  const reporting = "report-uri /api/csp-report; report-to csp-report"

  const enforcedCsp = [
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    reporting,
  ].join("; ")

  const reportOnlyCsp = [
    "default-src 'self'",
    // 'wasm-unsafe-eval' for crypto/wallet libs; strict-dynamic + nonce, never unsafe-inline.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`,
    // Styles allow inline (Next/Tailwind); unsafe-inline is forbidden for scripts only.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // RPC hosts mirror the web3.ts failover chain: publicnode (explicit fallback), then
    // viem's chain defaults for mainnet (eth.merkle.io) + sepolia (*.rpc.thirdweb.com).
    // The dedicated keyed RPC (Alchemy/Infura) must be allowlisted here when provisioned.
    "connect-src 'self' https://ethereum-rpc.publicnode.com https://ethereum-sepolia-rpc.publicnode.com https://eth.merkle.io https://*.rpc.thirdweb.com wss://relay.walletconnect.com wss://relay.walletconnect.org https://*.walletconnect.com https://*.walletconnect.org https://*.web3modal.org https://*.reown.com https://*.coinbase.com https://*.cbhq.net",
    "frame-src 'self' https://*.walletconnect.org https://*.walletconnect.com https://*.coinbase.com",
    "worker-src 'self' blob:",
    reporting,
  ].join("; ")

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  response.headers.set("Content-Security-Policy", enforcedCsp)
  response.headers.set("Content-Security-Policy-Report-Only", reportOnlyCsp)
  // Named endpoint the report-to directive points at (Reporting API v1).
  response.headers.set("Reporting-Endpoints", 'csp-report="/api/csp-report"')

  // Enforced hard headers (safe, no breakage risk).
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  )
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")

  return response
}

export const config = {
  // Run on pages/routes; skip Next static assets, image optimizer, and favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
