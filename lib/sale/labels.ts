import type { JourneyState } from "./types"

/** Minimal translator shape shared by the sale label helpers. next-intl's `useTranslations` /
 *  `getTranslations` return is structurally compatible (cast at the call site if TS complains). */
export type SaleTranslator = (key: string, values?: Record<string, string | number>) => string

type Tone = "default" | "danger" | "ok"

/** Collapsed sticky-bar CTA action label. */
export function bidCtaLabel(t: SaleTranslator, journey: JourneyState): string {
  switch (journey) {
    case "has-bid-winning":
    case "has-bid-pending":
      return t("ctaManageBid")
    case "has-bid-outbid":
      return t("ctaRaiseBid")
    case "kyc-failed":
      return t("ctaVerificationFailed")
    case "not-eligible":
      return t("ctaNotEligible")
    default:
      return t("ctaEnterSale")
  }
}

/** Dynamic title for the bid-panel section header (shown beside the connected wallet),
 *  per journey state. */
export function bidSectionTitle(t: SaleTranslator, journey: JourneyState): string {
  switch (journey) {
    case "kyc-required":
      return t("titleVerifyIdentity")
    case "kyc-incomplete":
      return t("verifyIncompleteTitle")
    case "kyc-pending":
      return t("verifyPendingTitle")
    case "kyc-failed":
      return t("verifyFailedTitle")
    case "not-eligible":
      return t("notEligibleTitle")
    case "wrong-network":
      return t("titleSwitchNetwork")
    case "has-bid-winning":
      return t("titleBidWinning")
    case "has-bid-outbid":
      return t("titleBidOutbid")
    default:
      return t("titlePlaceBid")
  }
}

export type VerifyStatusEntry<T extends Tone = Tone> = {
  icon: string
  tone: T
  title: string
  body: string
}

/** Verification-status copy shared across surfaces. Titles carry no trailing period. Per-entry
 *  tone literals are preserved so callers with a narrower tone union (e.g. default|danger) type. */
export function verifyStatus(t: SaleTranslator): {
  pending: VerifyStatusEntry<"default">
  failed: VerifyStatusEntry<"danger">
  "not-eligible": VerifyStatusEntry<"danger">
  verified: VerifyStatusEntry<"ok">
} {
  return {
    pending: {
      icon: "clock",
      tone: "default",
      title: t("verifyPendingTitle"),
      body: t("verifyPendingBody"),
    },
    failed: {
      icon: "shield-x",
      tone: "danger",
      title: t("verifyFailedTitle"),
      body: "",
    },
    "not-eligible": {
      icon: "shield-x",
      tone: "danger",
      title: t("notEligibleTitle"),
      body: t("notEligibleBody"),
    },
    verified: {
      icon: "shield-check",
      tone: "ok",
      title: t("verifiedTitle"),
      body: "",
    },
  }
}

/** Session live but entity setup unfinished on Sonar. Re-running OAuth cannot advance this state -
 *  the CTA links out to Echo's hosted setup page (app.echo.xyz/sonar/{saleUUID}) in a new tab. */
export function verifyIncomplete(t: SaleTranslator): { icon: string; title: string; cta: string } {
  return {
    icon: "shield-check",
    title: t("verifyIncompleteTitle"),
    cta: t("verifyIncompleteCta"),
  }
}

/** Returning visitor whose Sonar session expired: recognized, prompted to reconnect (status is re-fetched live, never shown from cache). */
export function welcomeBack(t: SaleTranslator): {
  icon: string
  tone: Tone
  title: string
  body: string
  cta: string
} {
  return {
    icon: "shield-check",
    tone: "default",
    title: t("welcomeBackTitle"),
    body: t("welcomeBackBody"),
    cta: t("welcomeBackCta"),
  }
}

/** Support contact (mailto) shown on a failed verification. null hides the CTA. */
export const SUPPORT_CONTACT_HREF: string | null = "mailto:tokensale@newtendermint.org"

/** Discord auction-support ticket: the primary get-help link on error surfaces (email is the fallback). null hides it. */
export const SUPPORT_DISCORD_HREF: string | null = "https://discord.gg/9cEJ7rqrm"

/** Appends terminal punctuation when missing; idempotent. */
export function punctuate(msg: string): string {
  const m = msg.trim()
  return /[.!?]$/.test(m) ? m : `${m}.`
}

/** Prefilled support mailto; falsy detail lines are dropped. FOOTGUN: the body is client-built
 *  and must stay PII-free (no wallet, tx hash or identity data). The translator is optional so
 *  server/test call sites without an i18n context still get the English scaffold. */
export function supportMailtoHref(
  subject: string,
  details: (string | false | null | undefined)[],
  t?: SaleTranslator,
): string | null {
  if (!SUPPORT_CONTACT_HREF) return null
  const describe = t
    ? t("supportBodyDescribe")
    : "Please describe what happened, any detail helps (steps, what you clicked, screenshots):"
  const privacy = t
    ? t("supportBodyPrivacy")
    : "Privacy: no personal info needed - leave out your wallet address, transaction hashes, amounts and identity documents. Support will ask if anything more is required."
  const body = [
    ...details.filter((line): line is string => Boolean(line)),
    "",
    describe,
    "",
    "",
    privacy,
  ].join("\r\n")
  const sep = SUPPORT_CONTACT_HREF.includes("?") ? "&" : "?"
  return `${SUPPORT_CONTACT_HREF}${sep}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** English fallback failed-verification support link, shared by non-i18n contexts (and pinned by
 *  the unit tests). Components should prefer `supportVerifyFailedHref(t)` for the localized body. */
export const SUPPORT_VERIFY_FAILED_HREF = supportMailtoHref(
  "sale.gno.land - Verification didn't pass",
  ['My verification status shows: "Verification didn\'t pass."'],
)

/** Localized failed-verification support link, shared by the bid gate row and the side panel. */
export function supportVerifyFailedHref(t: SaleTranslator): string | null {
  const status = t("verifyFailedTitle")
  return supportMailtoHref(
    t("supportSubjectVerifyFailed", { status }),
    [t("supportVerifyStatusLine", { status: punctuate(status) })],
    t,
  )
}

/** Awareness-mode "continue on desktop" copy. Registration has no entry here: mobile serves the
 *  real funnel during pre-sale. */
export function desktopOnly(t: SaleTranslator): {
  live: { title: string; body: string }
  ended: { title: string; body: string }
} {
  return {
    live: {
      title: t("desktopLiveTitle"),
      body: t("desktopLiveBody"),
    },
    ended: {
      title: t("desktopEndedTitle"),
      body: t("desktopEndedBody"),
    },
  }
}
