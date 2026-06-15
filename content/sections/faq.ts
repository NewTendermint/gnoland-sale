/**
 * Content data for the FAQ section.
 *
 * `content/sections.md` is the human source of truth for marketing/legal
 * copy. This module mirrors that copy for the build (dev-facing). Numbers and
 * dates are pulled from SALE_ECONOMICS so the answers can never drift from the
 * terms table; min/max commitment are PROVISIONAL there and update in one place.
 */
import { SALE_ECONOMICS, formatSaleDate } from "../../lib/sale/economics"
import { fmtPrice, fmtUsd } from "../../lib/sale/format"

export const faq: Array<{ q: string; a: string }> = [
  {
    q: "How does the auction work?",
    a: `This is a uniform price auction: every winner pays the same final clearing price. You set the maximum price you are willing to pay and the amount you commit; if the final clearing price ends at or below your maximum, you receive tokens at the clearing price, not at your maximum. Bidding stops early if the ${fmtPrice(SALE_ECONOMICS.maxPriceUsd)} hardcap is reached.`,
  },
  {
    q: "What happens if I get outbid?",
    a: "You can raise your bid at any time while the sale is open. If the final clearing price ends above your maximum, you do not receive tokens and your committed funds become refundable once the sale settles.",
  },
  {
    q: "What is Sonar and why do I need to verify my identity?",
    a: `This is a regulated public sale, so every participant completes a one-time identity verification (about 3 minutes) with Sonar, the compliance platform by Echo. Reviews are asynchronous and can take time, so register early - registration opens ${formatSaleDate(SALE_ECONOMICS.registrationOpensIso)}, two weeks before the sale.`,
  },
  {
    q: "Who can participate?",
    a: "Eligibility depends on your jurisdiction and is checked during Sonar verification. The sale is not available in some regions; if yours is restricted, Sonar will tell you during registration. US participants: accredited investors only, with a one-year lockup.",
  },
  {
    q: "What do I need to place a bid?",
    a: `A verified Sonar account, a self-custody wallet connected to Ethereum, and USDC to commit. Get these ready before the sale opens ${formatSaleDate(SALE_ECONOMICS.saleOpensIso, false)} - funding a wallet on sale day is the most common delay.`,
  },
  {
    q: "How much can I commit?",
    a: `Bids run from ${fmtPrice(SALE_ECONOMICS.startingPriceUsd)} to ${fmtPrice(SALE_ECONOMICS.maxPriceUsd)} per GNOT in $${SALE_ECONOMICS.bidIncrementUsd} steps - the form starts you at the cheapest price that is currently winning, and you move one step at a time. Commitments run between ${fmtUsd(SALE_ECONOMICS.minCommitmentUsd)} and ${fmtUsd(SALE_ECONOMICS.maxCommitmentUsd)} per participant.`,
  },
  {
    q: "When do I receive my tokens?",
    a: `Distribution begins ${formatSaleDate(SALE_ECONOMICS.mainnetIso)}, when transfers are enabled at mainnet. Tokens are sent to your wallet with the unlock schedule applied: 7% unlocks at launch, then 7% each month, with the final 9% in month 13. No cliff.`,
  },
  {
    q: "Can I withdraw my bid?",
    a: "No. A bid can be raised, never lowered or withdrawn while the sale runs. If your maximum ends below the final clearing price, your committed funds become refundable at settlement.",
  },
]
