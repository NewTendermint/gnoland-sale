import type { Config } from "@netlify/edge-functions"

/**
 * First-party proxy for Simple Analytics (ad-blocker bypass) that CANNOT leak site state.
 *
 * A plain netlify.toml proxy rewrite would forward the browser's same-origin Cookie header
 * (incl. the __Host-gnot_session bearer) to Simple Analytics - a third party. This function
 * proxies the same two upstreams but rebuilds the outgoing request from a strict allowlist,
 * so the session cookie, Authorization, Referer and the visitor IP never reach SA. "No leak"
 * is provable by reading FORWARD_HEADERS below, not by trusting undocumented edge behavior.
 *
 * /sgl.js   -> the SA loader (hostname + path baked in; keep `path` in sync with the /sgl/* route)
 * /sgl/*    -> the beacon/collect endpoint (path + query only)
 */
const LOADER = "https://simpleanalyticsexternal.com/proxy.js?hostname=sale.gno.land&path=/sgl"
const COLLECT_ORIGIN = "https://queue.simpleanalyticscdn.com"

// The only visitor headers SA needs (device/browser/language stats). Cookie, Authorization,
// Referer and x-forwarded-for are deliberately absent: they never leave our origin.
const FORWARD_HEADERS = ["user-agent", "accept", "accept-language", "content-type"]

export default async (request: Request): Promise<Response> => {
  const url = new URL(request.url)
  const upstream =
    url.pathname === "/sgl.js"
      ? LOADER
      : `${COLLECT_ORIGIN}${url.pathname.slice("/sgl".length)}${url.search}`

  const headers = new Headers()
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  // SA sends events via navigator.sendBeacon (POST). Buffer the body rather than streaming
  // request.body: a stream body needs `duplex` on the Deno runtime and would otherwise throw,
  // dropping every POST beacon. Payloads are sub-kB, so buffering is free.
  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const upstreamRes = await fetch(upstream, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  })

  // Pass the body/status/content-type through; strip any upstream Set-Cookie so a third party
  // can never plant a cookie on our origin, and nosniff so a mistyped upstream response can
  // never be sniffed into same-origin HTML/JS. The sandboxing CSP closes the case nosniff
  // can't: an upstream that declares text/html outright would otherwise render on OUR origin
  // (reflected XSS). Inert for the loader - a resource CSP only applies to navigations.
  const resHeaders = new Headers(upstreamRes.headers)
  resHeaders.delete("set-cookie")
  resHeaders.set("x-content-type-options", "nosniff")
  resHeaders.set("content-security-policy", "default-src 'none'; sandbox")
  return new Response(upstreamRes.body, { status: upstreamRes.status, headers: resHeaders })
}

export const config: Config = {
  path: ["/sgl.js", "/sgl/*"],
}
