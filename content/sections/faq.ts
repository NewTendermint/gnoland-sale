/**
 * Content data for the FAQ section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing). Numbers and
 * dates are pulled from SALE_ECONOMICS so the answers can never drift from the
 * terms table. An answer may be a single string or an array of paragraphs.
 *
 * Footgun: the worked examples below are illustrative literals - the refund example
 * (1,000 USDC bid $0.1806 / $0.1419 clearing) and the oversubscription example
 * ($20M / $10M / 50%) stay literal. Re-write them by hand if the band or supply moves.
 */
import {
  SALE_ECONOMICS,
  formatSaleDate,
  formatSaleDateTime,
  formatSaleMonth,
} from "../../lib/sale/economics"
import { fmtPrice } from "../../lib/sale/format"

export const faq: Array<{ q: string; a: string | string[] }> = [
  {
    q: "How does the auction work?",
    a: `The GNOT token sale takes place as a uniform-price auction (English auction) with a minimum price (starting price) of ${fmtPrice(SALE_ECONOMICS.startingPriceUsd)}. Participants submit bids in increments of $${SALE_ECONOMICS.bidIncrementUsd} at or above the clearing price. The price moves up when demand at or above a higher step is itself enough to buy the entire ${SALE_ECONOMICS.saleSupplyGnot.toLocaleString("en-US")} at that price. The clearing price is determined by demand at the end of the auction. All bids at or above the clearing price are successful.`,
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
      "1. You can wait until the sale ends and receive a full refund of your committed USDC.",
      "2. You can raise your bid with your current USDC commitment. You won't need to add more USDC - all you need to do is sign with your wallet.",
      "3. You can increase your commitment by depositing more USDC and placing a higher bid.",
    ],
  },
  {
    q: "If the clearing price is lower than my bid price, do I get a refund on the difference?",
    a: [
      "No. If the clearing price is lower than your bid, your committed USDC will buy tokens at that price.",
      "Example: A participant bids 1,000 USDC at $0.1806 per token. The clearing price is $0.1419. The participant receives tokens at $0.1419, spending $1,000 USDC.",
    ],
  },
  {
    q: "What happens if the sale is oversubscribed?",
    a: [
      "If total commitments exceed the available token supply, allocations are settled on a pro rata basis. Every participant's commitment is scaled down by the same percentage so that the total matches the sale supply.",
      "Example: If $20M is committed but only $10M worth of tokens are available, everyone receives 50% of their commitment. The rest is refunded after the sale is over.",
    ],
  },
  {
    q: "What is Sonar and why do I need to verify my identity?",
    a: `This is a regulated public sale, so every participant completes a one-time identity verification (about 3 minutes) with Sonar, the compliance platform by Echo. Reviews are asynchronous and can take time, so please register early. Registration opens ${formatSaleDate(SALE_ECONOMICS.registrationOpensIso)}, two weeks before the sale.`,
  },
  {
    q: "Who can participate?",
    a: [
      "Eligibility is determined by your jurisdiction and verified through Sonar during registration. The sale is unavailable in certain regions - if yours is restricted, Sonar will let you know.",
      "Participation is available to US residents who qualify as accredited investors.",
    ],
  },
  {
    q: "What do I need to place a bid?",
    a: `To participate in the sale, you will need to complete Sonar verification, set up a self-custody Ethereum wallet, and hold USDC. We recommend completing your identity verification and funding your wallet well ahead of the sale date of ${formatSaleDate(SALE_ECONOMICS.saleOpensIso)}.`,
  },
  {
    q: "Which wallets can I use?",
    a: [
      "You can participate with any self-custody Ethereum wallet that holds USDC and can sign on Ethereum. We recommend MetaMask, Coinbase Wallet, and Rabby. You can also connect through WalletConnect and use Rainbow, Trust Wallet, or Ledger.",
      "Install your wallet on your browser before connecting, as only installed wallets will appear. New to wallets? Check ethereum.org to compare and pick one.",
    ],
  },
  {
    q: "How much can I commit?",
    a: `The minimum commitment requirement is ${SALE_ECONOMICS.minCommitmentUsd} USDC, and there is no maximum commitment limit. You can bid at or above the starting price of ${fmtPrice(SALE_ECONOMICS.startingPriceUsd)} in $${SALE_ECONOMICS.bidIncrementUsd} increments.`,
  },
  {
    q: "When do I receive my tokens?",
    a: [
      `Token distribution is set to happen in ${formatSaleMonth(SALE_ECONOMICS.mainnetIso)}. There is no lockup for the public sale - 100% of your tokens will be transferable after distribution.`,
      "US accredited investors are subject to a 12-month lock-up following TGE, during which tokens may not be transferred or sold.",
    ],
  },
  {
    q: "Can I withdraw my bid?",
    a: "No. You cannot lower or cancel a bid while the sale is running. If your bid ends below the final clearing price, your committed funds are refunded after settlement.",
  },
]
