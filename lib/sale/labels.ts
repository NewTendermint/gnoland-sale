import type { JourneyState } from "./types"

/**
 * Collapsed sticky-bar CTA action label. Marketing "Place a bid" by default;
 * "Raise bid" once a bid exists (raise-only, the sole action). The live
 * winning/outbid status rides inside the button as a separate tag (BidStatusTag),
 * not in this string, so it reads as a distinct badge rather than blending into the
 * verb. Blocked states (kyc-failed / not-eligible) state the block. The CTA always
 * opens the expanded panel - relabeling it, never removing it. Server-safe (plain
 * module) so both the client BidPanel and the server /dev/states harness can import it.
 *
 * NOTE (copy): these are placeholder labels, to be validated by the team.
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
