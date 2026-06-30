import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Security headers + Content-Security-Policy.
 *
 * The hard headers are enforced. The nonce-based CSP ships Report-Only first so it
 * logs violations without blocking the wallet stack (WalletConnect relays over wss,
 * the Ethereum RPC, wasm in crypto libs). Validate the allowlist against real reports,
 * then rename the header to "Content-Security-Policy" to enforce (at which point
 * Next auto-applies the nonce to its own scripts, clearing the script-src reports).
 *
 * Chain RPC + WalletConnect/Coinbase endpoints are the moving parts of connect-src;
 * everything else is self. No analytics wired yet (add its hosts here when it is).
 */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID())

  const csp = [
    "default-src 'self'",
    // 'wasm-unsafe-eval' for crypto/wallet libs; strict-dynamic + nonce, never unsafe-inline.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`,
    // Styles allow inline (Next/Tailwind); unsafe-inline is forbidden for scripts only.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // RPC hosts are viem's public defaults for mainnet (eth.merkle.io) + sepolia
    // (*.rpc.thirdweb.com). Set a dedicated RPC (Alchemy/Infura) + allowlist it here
    // before prod; public endpoints rate-limit and are not launch-grade.
    "connect-src 'self' https://eth.merkle.io https://*.rpc.thirdweb.com wss://relay.walletconnect.com wss://relay.walletconnect.org https://*.walletconnect.com https://*.walletconnect.org https://*.web3modal.org https://*.reown.com https://*.coinbase.com https://*.cbhq.net",
    "frame-src 'self' https://*.walletconnect.org https://*.walletconnect.com https://*.coinbase.com",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join("; ")

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // CSP: Report-Only for now (observe, never block). Rename to
  // "Content-Security-Policy" to enforce once the allowlist is validated.
  response.headers.set("Content-Security-Policy-Report-Only", csp)

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
