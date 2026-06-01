import type { JourneyState } from "./types"

/**
 * Collapsed sticky-bar CTA label. Marketing "Place a bid" by default; switches
 * for states where the user has clearly already bid (winning / outbid) or is
 * blocked (kyc-failed / not-eligible). The CTA always opens the expanded panel -
 * relabeling it, never removing it. Server-safe (plain module) so both the
 * client BidPanel and the server /dev/states harness can import it.
 *
 * NOTE (copy): these are placeholder labels, to be validated by the team.
 */
export function bidCtaLabel(journey: JourneyState): string {
  switch (journey) {
    case "has-bid-outbid":
      return "Raise bid"
    case "has-bid-winning":
      return "Manage bid"
    case "kyc-failed":
      return "Verification failed"
    case "not-eligible":
      return "Not eligible"
    default:
      return "Place a bid"
  }
}
