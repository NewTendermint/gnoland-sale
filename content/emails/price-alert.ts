import { fmtPrice } from "../../lib/sale/format"
import type { SaleTranslator } from "../../lib/sale/labels"

// Copy for the automated clearing-price alert campaign (validated 2026-07-05). The sale URL is
// intentionally the final public domain, not NEXT_PUBLIC_SITE_URL (pre-cutover it points at the
// netlify.app host, which must never land in a subscriber inbox).
const SALE_URL = "https://sale.gno.land"

// The translator is optional so the existing (single-locale) campaign caller keeps working with
// the English copy; pass an "Email"-namespace translator to localize.
export function priceEmailSubject(priceUsd: number, t?: SaleTranslator): string {
  const price = fmtPrice(priceUsd)
  return t ? t("subject", { price }) : `GNOT sale: the clearing price is now ${price}`
}

export function priceEmailHtml(priceUsd: number, t?: SaleTranslator): string {
  const price = fmtPrice(priceUsd)
  const strongPrice = `<strong>${price}</strong>`
  const heading = t ? t("heading") : "GNOT public sale"
  const risen = t
    ? t("bodyRisen", { price: strongPrice })
    : `The auction clearing price has risen to ${strongPrice} per GNOT.`
  const outbid = t
    ? t("bodyOutbid")
    : "If you placed a bid below this price, it is currently outbid."
  const link = t ? t("link") : "Check your position on sale.gno.land"
  return [
    `<h1 style="font-family:monospace">${heading}</h1>`,
    `<p>${risen}</p>`,
    `<p>${outbid}</p>`,
    `<p><a href="${SALE_URL}">${link}</a></p>`,
  ].join("\n")
}
