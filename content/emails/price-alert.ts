import { fmtPrice } from "../../lib/sale/format"

// Copy for the automated clearing-price alert campaign (validated 2026-07-05). The sale URL is
// intentionally the final public domain, not NEXT_PUBLIC_SITE_URL (pre-cutover it points at the
// netlify.app host, which must never land in a subscriber inbox).
const SALE_URL = "https://sale.gno.land"

export function priceEmailSubject(priceUsd: number): string {
  return `GNOT sale: the clearing price is now ${fmtPrice(priceUsd)}`
}

export function priceEmailHtml(priceUsd: number): string {
  const price = fmtPrice(priceUsd)
  return [
    `<h1 style="font-family:monospace">GNOT public sale</h1>`,
    `<p>The auction clearing price has risen to <strong>${price}</strong> per GNOT.</p>`,
    "<p>If you placed a bid below this price, it is currently outbid.</p>",
    `<p><a href="${SALE_URL}">Check your position on sale.gno.land</a></p>`,
  ].join("\n")
}
