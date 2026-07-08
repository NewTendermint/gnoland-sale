import type { Config } from "@netlify/edge-functions"

// THROWAWAY - empirical proof that the header allowlist strips the session cookie on the real
// Netlify edge runtime. Same forwarding logic as analytics-proxy.ts, but the upstream is an
// echo service that returns the headers IT received. DELETE after verifying /sgltest shows no
// Cookie. Not referenced by the app; renders nothing.
const ECHO = "https://httpbin.org/anything"
const FORWARD_HEADERS = ["user-agent", "accept", "accept-language", "content-type"]

export default async (request: Request): Promise<Response> => {
  const headers = new Headers()
  for (const name of FORWARD_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  const res = await fetch(ECHO, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
  })
  const resHeaders = new Headers(res.headers)
  resHeaders.delete("set-cookie")
  return new Response(res.body, { status: res.status, headers: resHeaders })
}

export const config: Config = {
  path: "/sgltest/*",
}
