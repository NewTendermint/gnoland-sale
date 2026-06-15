import type { JourneyState } from "./types"

/**
 * Collapsed sticky-bar CTA action label. "Place a bid" by default; "Raise bid"
 * once a bid exists (raise is the only action). Live winning/outbid status rides
 * inside the button as a separate tag (BidStatusTag), not in this string, so it
 * reads as a distinct badge. Blocked states (kyc-failed / not-eligible) name the
 * block. The CTA always opens the expanded panel, relabeling it but never
 * removing it. Plain module so both the client BidPanel and the server
 * /dev/states harness can import it.
 *
 * Copy: placeholder labels, pending team validation.
 */
export function bidCtaLabel(journey: JourneyState): string {
  switch (journey) {
    case "has-bid-outbid":
    case "has-bid-winning":
      return "Raise bid"
    case "kyc-failed":
      return "Verification failed"
    case "not-eligible":
      return "Not eligible"
    default:
      return "Place a bid"
  }
}

/**
 * Verification-status copy shared by its three surfaces (bid gate rows, pre-sale
 * bar, How-to status line) so the owner-validated wording can never drift apart.
 * Titles carry no trailing period; each surface adds its own punctuation.
 */
export const VERIFY_STATUS = {
  pending: {
    title: "Verification in progress",
    body: "We will let you know as soon as Sonar has reviewed it.",
  },
  failed: {
    title: "Verification did not pass",
    body: "Contact support if you believe this is an error.",
  },
  "not-eligible": {
    title: "Not eligible",
    body: "This sale is not available in your region.",
  },
} as const

/**
 * Awareness-mode "continue on desktop" copy (touch devices or < lg viewports;
 * see docs/specs/2026-06-13-mobile-awareness-only-design.md). Shared by the
 * read-only bar and the section CTA swaps so the wording can never drift.
 * Same shape and punctuation convention as VERIFY_STATUS: titles carry no
 * trailing period, each surface adds its own.
 *
 * Copy: placeholder labels, pending team validation.
 */
export const DESKTOP_ONLY = {
  register: {
    title: "Registration is open",
    body: "Register from a desktop browser at sale.gno.land.",
  },
  live: {
    title: "Bidding happens on desktop",
    body: "For your security, bids are placed from a desktop browser with your wallet. Open sale.gno.land on your computer.",
  },
  ended: {
    title: "Results and claims are on desktop",
    body: "Connect on your computer to view your settlement and claim any refund.",
  },
} as const
