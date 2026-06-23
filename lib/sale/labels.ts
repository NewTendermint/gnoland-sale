import type { JourneyState } from "./types"

/** Collapsed sticky-bar CTA action label. Copy: placeholder, pending team validation. */
export function bidCtaLabel(journey: JourneyState): string {
  switch (journey) {
    case "has-bid-winning":
      return "Manage bid"
    case "has-bid-outbid":
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
    icon: "clock",
    tone: "default",
    title: "Verification in progress",
    body: "Sonar is reviewing it.",
  },
  failed: {
    icon: "shield-x",
    tone: "danger",
    title: "Verification didn't pass",
    body: "",
  },
  "not-eligible": {
    icon: "shield-x",
    tone: "danger",
    title: "Not eligible",
    body: "This sale isn't available to you.",
  },
  verified: {
    icon: "shield-check",
    tone: "ok",
    title: "Identity verified",
    body: "",
  },
} as const

/** Returning visitor whose Sonar session expired: recognized, prompted to reconnect (status is re-fetched live, never shown from cache). */
export const WELCOME_BACK = {
  icon: "shield-check",
  tone: "default",
  title: "Welcome back",
  body: "Reconnect to see your verification status.",
  cta: "Reconnect",
} as const

/** Support contact (mailto) shown on a failed verification. null hides the CTA. */
export const SUPPORT_CONTACT_HREF: string | null = "mailto:tokensale@newtendermint.org"

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
