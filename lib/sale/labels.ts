import type { JourneyState } from "./types"

/** Collapsed sticky-bar CTA action label. Copy: placeholder, pending team validation. */
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
      return "Enter the Sale"
  }
}

/** Verification-status copy shared across surfaces. Titles carry no trailing period. */
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

/** Awareness-mode "continue on desktop" copy. Copy: placeholder, pending team validation. */
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
