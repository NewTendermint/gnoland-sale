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
