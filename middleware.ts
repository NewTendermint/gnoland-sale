import createMiddleware from "next-intl/middleware"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { disabledLocalePath } from "./i18n/locales"
import { routing } from "./i18n/routing"
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_COOKIE_MAX_AGE,
  influencerDestination,
  influencerHandleFor,
} from "./lib/analytics/influencer-links"

/**
 * Two responsibilities, composed:
 *
 * 1) Locale routing (next-intl). Runs on HTML page paths only. It negotiates the active locale
 *    (cookie -> Accept-Language best-fit -> defaultLocale) and, with localePrefix 'as-needed',
 *    keeps the default locale at "/". A disabled locale's prefix (see i18n/locales.ts) is stripped
 *    with a redirect before that layer runs, so an old shared link still resolves. API routes,
 *    Next internals, and static files (any path with a dot) are NEVER locale-routed, so the
 *    Sonar OAuth callback (/api/auth/sonar/callback) and every /api/* route are untouched.
 *
 * 2) Security headers + Content-Security-Policy (decision recorded in issue #14, "CSP enforce").
 *    Applied to EVERY matched response, page or API, exactly as before the i18n change.
 *
 * ENFORCED - the injection-hardening directives no page behavior can trip (no <base>, no native
 * form posts, no plugins; framing already denied by X-Frame-Options).
 *
 * REPORT-ONLY - the strict script policy + the wallet-stack allowlist. The page is statically
 * rendered, so the nonce cannot reach the HTML's own script tags and every self-hosted chunk
 * reports under strict-dynamic: these reports are aspirational noise, NOT enforce candidates.
 * Before enforcing connect-src/frame-src, validate the wallet allowlist (WalletConnect relays
 * over wss, the Ethereum RPC, Coinbase) with a real wallet journey on a preview.
 *
 * Chain RPC + WalletConnect/Coinbase endpoints are the moving parts of connect-src; everything
 * else is self. Simple Analytics is same-origin by design (script from /sgl.js, events to
 * /sgl/* via the Netlify proxy), so 'self' covers it and no SA host belongs in this policy.
 */

const handleI18nRouting = createMiddleware(routing)

const HSTS = "max-age=63072000; includeSubDomains; preload"

// Every early return below is a bodyless redirect, which skips the security-header block at the end
// of the middleware. HSTS is the one header that still matters on such a hop (it is what stops a
// downgrade on the very first click of a shared link), so each redirect carries it explicitly.
function secureRedirect(url: URL): NextResponse {
  const response = NextResponse.redirect(url)
  response.headers.set("Strict-Transport-Security", HSTS)
  return response
}

// A path is a locale-routable page when it is not an API route, not a Next internal, and has no
// file extension (mirrors next-intl's recommended `(?!api|_next|...|.*\\..*)` matcher intent).
function isLocaleRoutable(pathname: string): boolean {
  if (pathname.startsWith("/api")) return false
  if (pathname.startsWith("/_next")) return false
  return !/\.[^/]+$/.test(pathname)
}

export function middleware(request: NextRequest) {
  // Promoter vanity links: `/<handle>` -> tagged site root, so analytics attributes the visit to the
  // individual promoter. We also drop a first-party attribution cookie here so a later authenticated
  // entity read can bind this visitor's KYC identity to the promoter, surviving the Sonar OAuth hop
  // and a device switch (see lib/analytics/attribution.ts). Server-set on the redirect, so a
  // script/ad blocker cannot suppress it. Done ahead of locale routing because that layer runs first
  // on the hosting platform and would otherwise resolve `/<handle>` to a localized not-found before a
  // build-time redirect could fire. The tagged destination then flows through locale negotiation
  // normally (the query is preserved on the locale hop). See lib/analytics/influencer-links.ts.
  const vanityHandle = influencerHandleFor(request.nextUrl.pathname)
  if (vanityHandle) {
    const redirect = secureRedirect(new URL(influencerDestination(vanityHandle), request.url))
    // Not HttpOnly: the value is a public promoter handle (no secret), read server-side for the
    // attribution capture AND client-side for the Simple Analytics funnel tag (track.ts).
    redirect.cookies.set(ATTRIBUTION_COOKIE, vanityHandle, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ATTRIBUTION_COOKIE_MAX_AGE,
    })
    return redirect
  }

  // Disabled-locale prefixes (`/ko`, `/ko/terms-of-service`, ...) collapse onto the served path,
  // query string intact (see disabledLocalePath in i18n/locales.ts for the decoding rules).
  // Temporary (307, NextResponse.redirect's default), never permanent: a cached 301 would fight
  // the locale coming back. Done here rather than in next.config redirects because on Netlify the
  // locale-routing layer runs first and would resolve the prefix to a localized not-found before a
  // build-time redirect could fire.
  const servedPath = disabledLocalePath(request.nextUrl.pathname)
  if (servedPath) {
    const url = request.nextUrl.clone()
    url.pathname = servedPath
    return secureRedirect(url)
  }

  const response = isLocaleRoutable(request.nextUrl.pathname)
    ? handleI18nRouting(request)
    : NextResponse.next()

  const nonce = btoa(crypto.randomUUID())

  // report-uri for Firefox/Safari, report-to (Reporting-Endpoints header below) for Chromium;
  // a Report-Only policy without a reporting target never leaves the visitor's DevTools console.
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
  response.headers.set("Strict-Transport-Security", HSTS)

  return response
}

export const config = {
  // Run on pages/routes (incl. /api, which gets security headers but is never locale-routed);
  // skip Next static assets, image optimizer, and favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
