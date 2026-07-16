/**
 * FAQ content, i18n-aware.
 *
 * `buildFaq(t, locale)` reconstructs the question/answer list from the "Faq" message namespace,
 * keeping the same FaqBlock shape the renderer and the schema.org flattening expect. Numbers and
 * dates are still pulled from SALE_ECONOMICS and injected via ICU placeholders so the answers can
 * never drift from the terms table. Used by both the client Faq section (useTranslations) and the
 * server FAQPage JSON-LD (getTranslations).
 *
 * Footgun: the worked examples ($0.0645 / $0.086, 30M-40M vs 38,760,000; the 1,000 USDC refund
 * example; the $20M / $10M / 50% oversubscription example) are illustrative literals living in the
 * message catalog. Re-write them by hand (in every locale) if the band or supply moves.
 */
import { firstDayBonusEnabled } from "../../lib/sale/bonus"
import {
  SALE_ECONOMICS,
  formatSaleDate,
  formatSaleDateTime,
  formatSaleMonth,
} from "../../lib/sale/economics"
import { fmtPrice } from "../../lib/sale/format"
import { SUPPORT_CONTACT_HREF } from "../../lib/sale/labels"

export type FaqLink = { label: string; href: string }
export type FaqBlock = string | { strong: string } | { parts: Array<string | FaqLink> }
export type FaqItem = { id: string; q: string; a: string | FaqBlock[] }

// Minimal shape shared by next-intl's client (useTranslations) and server (getTranslations)
// translators: callable with a key and optional ICU values, returning a string.
export type FaqTranslator = (key: string, values?: Record<string, string | number>) => string

export function buildFaq(t: FaqTranslator, locale: string): FaqItem[] {
  const startPrice = fmtPrice(SALE_ECONOMICS.startingPriceUsd)
  const inc = String(SALE_ECONOMICS.bidIncrementUsd)
  const supply = SALE_ECONOMICS.saleSupplyGnot.toLocaleString(locale)
  const regDateTime = formatSaleDateTime(SALE_ECONOMICS.registrationOpensIso, locale)
  const startDateTime = formatSaleDateTime(SALE_ECONOMICS.saleOpensIso, locale)
  const endDateTime = formatSaleDateTime(SALE_ECONOMICS.saleClosesIso, locale)
  const regDate = formatSaleDate(SALE_ECONOMICS.registrationOpensIso, true, locale)
  const saleDate = formatSaleDate(SALE_ECONOMICS.saleOpensIso, true, locale)
  const mainnetMonth = formatSaleMonth(SALE_ECONOMICS.mainnetIso, locale)

  const helpParts: Array<string | FaqLink> = [
    ...(SUPPORT_CONTACT_HREF
      ? [
          t("help.emailPrefix"),
          { label: SUPPORT_CONTACT_HREF.replace(/^mailto:/, ""), href: SUPPORT_CONTACT_HREF },
          t("help.emailSuffix"),
        ]
      : []),
    t("help.discordPrefix"),
    { label: t("help.discordLabel"), href: "https://discord.gg/gnoland" },
    t("help.discordSuffix"),
  ]

  return [
    {
      id: "auction",
      q: t("auction.q"),
      a: [
        t("auction.a1", { startPrice, inc, supply }),
        { strong: t("auction.example1Title") },
        t("auction.example1"),
        { strong: t("auction.example2Title") },
        t("auction.example2"),
      ],
    },
    // Promo, gated: only listed while the first-day bonus is surfaced (firstDayBonusEnabled).
    ...(firstDayBonusEnabled()
      ? [
          {
            id: "bonus",
            q: t("bonus.q"),
            a: [t("bonus.a1"), t("bonus.a2"), t("bonus.a3")],
          },
        ]
      : []),
    {
      id: "date",
      q: t("date.q"),
      a: [t("date.a1", { regDateTime }), t("date.a2", { startDateTime, endDateTime })],
    },
    {
      id: "outbid",
      q: t("outbid.q"),
      a: [t("outbid.a1"), t("outbid.a2"), t("outbid.a3"), t("outbid.a4")],
    },
    {
      id: "refund",
      q: t("refund.q"),
      a: [t("refund.a1"), t("refund.a2")],
    },
    {
      id: "oversubscribed",
      q: t("oversubscribed.q"),
      a: [t("oversubscribed.a1"), t("oversubscribed.a2")],
    },
    {
      id: "sonar",
      q: t("sonar.q"),
      a: t("sonar.a", { regDate }),
    },
    {
      id: "eligibility",
      q: t("eligibility.q"),
      a: [t("eligibility.a1"), t("eligibility.a2")],
    },
    {
      id: "requirements",
      q: t("requirements.q"),
      a: t("requirements.a", { saleDate }),
    },
    {
      id: "wallets",
      q: t("wallets.q"),
      a: [t("wallets.a1"), t("wallets.a2")],
    },
    {
      id: "commitment",
      q: t("commitment.q"),
      a: t("commitment.a", { min: SALE_ECONOMICS.minCommitmentUsd, startPrice, inc }),
    },
    {
      id: "distribution",
      q: t("distribution.q"),
      a: [t("distribution.a1", { mainnetMonth }), t("distribution.a2")],
    },
    {
      id: "withdraw",
      q: t("withdraw.q"),
      a: t("withdraw.a"),
    },
    // Keep this entry LAST: the help channels stay visible at the bottom of the list.
    {
      id: "help",
      q: t("help.q"),
      a: [{ parts: helpParts }],
    },
  ]
}

/**
 * Flatten an answer (string | FaqBlock[]) to a single plain-text string.
 *
 * FaqBlock variants collapse to their visible text: strings stay as-is, `{ strong }`
 * uses its label, and `{ parts }` joins each part (link parts contribute their `label`,
 * not the href). Blocks are joined with a space so paragraphs read as continuous prose.
 * Used to source schema.org FAQPage `acceptedAnswer.text`, which requires plain text.
 */
export function faqAnswerText(a: string | FaqBlock[]): string {
  if (typeof a === "string") return a
  return a
    .map((block) => {
      if (typeof block === "string") return block
      if ("strong" in block) return block.strong
      return block.parts.map((part) => (typeof part === "string" ? part : part.label)).join("")
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}
