/**
 * Content data for the FAQ section.
 *
 * Section copy for the build (dev-facing). Numbers and
 * dates are pulled from SALE_ECONOMICS so the answers can never drift from the
 * terms table. An answer may be a single string or an array of paragraphs.
 *
 * Footgun: the worked examples below are illustrative literals - the auction steps
 * ($0.0645 / $0.086, 30M-40M vs 38,760,000), the refund example (1,000 USDC bid
 * $0.172 / $0.129 clearing) and the oversubscription example ($20M / $10M / 50%) stay
 * literal. Re-write them by hand if the band or supply moves.
 */
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

export const faq: Array<{ q: string; a: string | FaqBlock[] }> = [
  {
    q: "How does the auction work?",
    a: [
      `The GNOT token sale takes place as a uniform-price auction (English auction) with a minimum price (starting price) of ${fmtPrice(SALE_ECONOMICS.startingPriceUsd)}. Participants submit bids in increments of $${SALE_ECONOMICS.bidIncrementUsd} at or above the clearing price. The price moves up when demand at or above a higher step is itself enough to buy the entire ${SALE_ECONOMICS.saleSupplyGnot.toLocaleString("en-US")} at that price. The clearing price is determined by demand at the end of the auction. All bids at or above the clearing price are successful.`,
      { strong: "Example 1: Clearing price stays at current level" },
      "Bids received: 30,000,000 GNOT at $0.0645, 20,000,000 GNOT at $0.086. Since total demand at $0.086 (20M) falls short of the 38,760,000 GNOT being sold, the clearing price remains $0.0645. Winning bidders receive tokens pro rata, and excess bid amounts are refunded.",
      { strong: "Example 2: Clearing price increases" },
      "Bids received: 40,000,000 GNOT at $0.0645, 40,000,000 GNOT at $0.086. Since demand at $0.086 (40M) exceeds the 38,760,000 GNOT available, the clearing price rises to $0.086. Bidders at $0.0645 are not allocated tokens - only bids at or above the clearing price qualify. Winning bidders receive tokens pro rata, and excess bid amounts are refunded.",
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
      "1. You can wait until the sale ends and receive a full refund of your committed USDC.",
      "2. You can raise your bid with your current USDC commitment. You won't need to add more USDC - all you need to do is sign with your wallet.",
      "3. You can increase your commitment by depositing more USDC and placing a higher bid.",
    ],
  },
  {
    q: "If the clearing price is lower than my bid price, do I get a refund on the difference?",
    a: [
      "No. If the clearing price is lower than your bid, your committed USDC will buy tokens at the clearing price.",
      "Example: A participant bids 1,000 USDC at $0.172 per token. The clearing price is $0.129. The participant receives tokens at $0.129, spending $1,000 USDC.",
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
  // Keep this entry LAST: the help channels stay visible at the bottom of the list.
  {
    q: "How do I get help?",
    a: [
      {
        parts: [
          ...(SUPPORT_CONTACT_HREF
            ? [
                "For issues with your bid, verification, or payment, email ",
                { label: SUPPORT_CONTACT_HREF.replace(/^mailto:/, ""), href: SUPPORT_CONTACT_HREF },
                ". ",
              ]
            : []),
          "For general questions, join the ",
          { label: "Gno.land Discord", href: "https://discord.gg/gnoland" },
          ". We will never DM you first or ask for your seed phrase.",
        ],
      },
    ],
  },
]
