/**
 * Content data for the FAQ section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing). Numbers and
 * dates are pulled from SALE_ECONOMICS so the answers can never drift from the
 * terms table. An answer may be a single string or an array of paragraphs.
 *
 * Footgun: the worked outbid examples below are illustrative - the GNOT figures
 * (1,550.38 / 775.19) are hand-pinned to the $0.0645 / $0.129 price band, so they
 * stay literal. Re-write them by hand if that band ever moves.
 */
import {
  SALE_ECONOMICS,
  formatSaleDate,
  formatSaleDateTime,
  formatSaleMonth,
} from "../../lib/sale/economics"
import { fmtPrice, fmtUsd } from "../../lib/sale/format"

const hardcap = fmtPrice(SALE_ECONOMICS.maxPriceUsd)

export const faq: Array<{ q: string; a: string | string[] }> = [
  {
    q: "How does the auction work?",
    a: [
      "The token sale takes place as a uniform price auction (English auction) where every winner pays the same clearing price per token. You can bid at or above the current clearing price and set the amount you want to commit in USDC. If the final clearing price is the same as your bid price, you receive tokens at the clearing price. If the final clearing price is below your bid price, you receive tokens at the clearing price and receive a refund of the price difference.",
      `The hard cap price for the auction is ${hardcap}, which means the maximum clearing price for this auction is ${hardcap}. Bidding may continue after the hard cap price of ${hardcap} is reached. If the total bids exceed the amount of tokens available at the hard cap price, tokens will be distributed pro rata among all participants. Refunds will be issued after the sale is over.`,
    ],
  },
  {
    q: "When is the token sale date?",
    a: [
      `Registration with Sonar opens ${formatSaleDateTime(SALE_ECONOMICS.registrationOpensIso)}.`,
      `The token sale starts ${formatSaleDateTime(SALE_ECONOMICS.saleOpensIso)}. The sale ends ${formatSaleDateTime(SALE_ECONOMICS.saleClosesIso)}.`,
    ],
  },
  {
    q: "What happens if I get outbid?",
    a: [
      "If you are outbid during the sale, you can do one of three things.",
      "1. You can wait until the end of the sale settlement to receive your refund. If the final clearing price ends above your bid price, you do not receive tokens, and your committed USDC is refunded after the sale settles.",
      "2. You can bid again at a modified price with your current USDC deposit. Let's say you commit 100 USDC at $0.0645 for 1,550.38 GNOT and are outbid. The current clearing price is $0.129. You can bid again with the 100 USDC at $0.129 for 775.19 GNOT. You won't need to add more USDC - all you need to do is sign with your wallet.",
      "3. You can bid again at a modified price with your current USDC deposit + added USDC. Let's say you commit 100 USDC at $0.0645 for 1,550.38 GNOT and are outbid. The current clearing price is $0.129. You can deposit 100 more USDC and bid again. Your total commitment is 200 USDC at $0.129 for 1,550.38 GNOT.",
    ],
  },
  {
    q: "What is Sonar and why do I need to verify my identity?",
    a: `This is a regulated public sale, so every participant completes a one-time identity verification (about 3 minutes) with Sonar, the compliance platform by Echo. Reviews are asynchronous and can take time, so please register early. Registration opens ${formatSaleDate(SALE_ECONOMICS.registrationOpensIso)}, two weeks before the sale.`,
  },
  {
    q: "Who can participate?",
    a: "Eligibility depends on your jurisdiction and is checked during Sonar verification. The sale is not available in some regions; if yours is restricted, Sonar will tell you during registration. US participants: only accredited investors can participate, with a one-year lockup applied.",
  },
  {
    q: "What do I need to place a bid?",
    a: `To participate in the sale, you will need to complete Sonar verification, set up a self-custody Ethereum wallet, and hold USDC. We recommend completing your identity verification and funding your wallet well ahead of the sale date of ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}.`,
  },
  {
    q: "How much can I commit?",
    a: `The minimum commitment requirement is ${fmtUsd(SALE_ECONOMICS.minCommitmentUsd)} USDC, and there is no maximum commitment limit. You can bid anywhere between the starting price of ${fmtPrice(SALE_ECONOMICS.startingPriceUsd)} and the maximum price of ${fmtPrice(SALE_ECONOMICS.maxPriceUsd)} in $${SALE_ECONOMICS.bidIncrementUsd} increments.`,
  },
  {
    q: "When do I receive my tokens?",
    a: [
      `Token distribution is set to happen in ${formatSaleMonth(SALE_ECONOMICS.mainnetIso)}. After you receive your tokens, tokens will be transferable with an unlock schedule applied.`,
      "The unlock schedule is as follows: 7% unlocks at token generation, then 7% each month, with the final 9% unlocked in month 14. There is no cliff.",
    ],
  },
  {
    q: "Can I withdraw my bid?",
    a: "No. You cannot lower or cancel a bid while the sale is running. If your bid ends below the final clearing price, your committed funds are refunded after settlement.",
  },
]
