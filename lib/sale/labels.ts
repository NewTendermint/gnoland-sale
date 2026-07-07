import type { JourneyState } from "./types"

/** Collapsed sticky-bar CTA action label. */
export function bidCtaLabel(journey: JourneyState): string {
  switch (journey) {
    case "has-bid-winning":
    case "has-bid-pending":
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

/** Dynamic title for the bid-panel section header (shown beside the connected wallet),
 *  per journey state. */
export function bidSectionTitle(journey: JourneyState): string {
  switch (journey) {
    case "kyc-required":
      return "Verify your identity"
    case "kyc-incomplete":
      return VERIFY_INCOMPLETE.title
    case "kyc-pending":
      return "Verification in progress"
    case "kyc-failed":
      return "Verification didn't pass"
    case "not-eligible":
      return "Not eligible"
    case "wrong-network":
      return "Switch network"
    case "has-bid-winning":
      return "Your bid is winning"
    case "has-bid-outbid":
      return "Your bid was outbid"
    default:
      return "Place your bid"
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

/** Session live but entity setup unfinished on Sonar. Re-running OAuth cannot advance this state -
 *  the CTA links out to Echo's hosted setup page (app.echo.xyz/sonar/{saleUUID}) in a new tab. */
export const VERIFY_INCOMPLETE = {
  icon: "shield-check",
  title: "Finish your verification",
  cta: "Complete on Sonar",
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

/** Appends terminal punctuation when missing; idempotent. */
export function punctuate(msg: string): string {
  const m = msg.trim()
  return /[.!?]$/.test(m) ? m : `${m}.`
}

/** Prefilled support mailto; falsy detail lines are dropped. FOOTGUN: the body is client-built
 *  and must stay PII-free (no wallet, tx hash or identity data). */
export function supportMailtoHref(
  subject: string,
  details: (string | false | null | undefined)[],
): string | null {
  if (!SUPPORT_CONTACT_HREF) return null
  const body = [
    ...details.filter((line): line is string => Boolean(line)),
    "",
    "Please describe what happened, any detail helps (steps, what you clicked, screenshots):",
    "",
    "",
    "Privacy: no personal info needed - leave out your wallet address, transaction hashes, amounts and identity documents. Support will ask if anything more is required.",
  ].join("\r\n")
  const sep = SUPPORT_CONTACT_HREF.includes("?") ? "&" : "?"
  return `${SUPPORT_CONTACT_HREF}${sep}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** Failed-verification support link, shared by the bid gate row and the side panel. */
export const SUPPORT_VERIFY_FAILED_HREF = supportMailtoHref(
  `sale.gno.land - ${VERIFY_STATUS.failed.title}`,
  [`My verification status shows: "${punctuate(VERIFY_STATUS.failed.title)}"`],
)

/** Awareness-mode "continue on desktop" copy. */
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
