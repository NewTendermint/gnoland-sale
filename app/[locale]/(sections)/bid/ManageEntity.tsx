"use client"

import { useTranslations } from "next-intl"
import { ROUND_ICON_BUTTON_VARIANTS } from "../../(layout)/AddToCalendarButton"
import { Cta } from "../../(ui)/Cta"

/** Power glyph shared by every Sonar sign-out control; same drawing as the WalletButton's, so
 *  "identity + power = disconnect" reads the same for the wallet and the Sonar account. */
export function PowerGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

/** The active Sonar entity linking out to account management (add a business entity, switch,
 *  finish setup). With a sign-out handler, a separate round power button rides along - two
 *  controls, each with its family's standard hover, grouped tighter than their neighbours.
 *  Variant follows the surface: "ghost" on the light bar, "ghost-contrast" inside the dark
 *  capsule. Label = user's own PII, shown only to them. */
export function ManageEntityCta({
  href,
  label,
  variant = "ghost",
  onSignOut,
}: {
  href: string
  label?: string | null
  variant?: "ghost" | "ghost-contrast"
  onSignOut?: () => void
}) {
  const t = useTranslations("Bid")
  const cta = (
    <Cta variant={variant} href={href} external arrow={!onSignOut} ariaLabel={t("manageSonarAria")}>
      <span className="max-w-[20ch] truncate">{label ?? t("mySonarAccount")}</span>
    </Cta>
  )
  if (!onSignOut) return cta
  return (
    <span className="inline-flex items-center gap-1.5">
      {cta}
      <SonarSignOutButton onSignOut={onSignOut} variant={variant === "ghost" ? "bar" : "tile"} />
    </span>
  )
}

const SIGN_OUT_VARIANTS = {
  bar: { button: ROUND_ICON_BUTTON_VARIANTS.bar, glyph: "h-5 w-5" },
  tile: { button: ROUND_ICON_BUTTON_VARIANTS.tile, glyph: "h-5 w-5" },
  // Ringless glyph for dense text rows (the bid header); the padding is invisible hit area
  // (24px+ touch target), offset away so the visual stays the bare icon.
  bare: {
    button:
      "-m-1.5 inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-muted transition-colors hover:text-foreground",
    glyph: "h-3.5 w-3.5",
  },
} as const

/** Sign-out button ending the Sonar session (server session + tokens + local caches via the
 *  caller). "bar" on the light bar, "tile" inside the dark capsule, "bare" in dense text rows. */
export function SonarSignOutButton({
  onSignOut,
  variant = "bar",
}: { onSignOut: () => void; variant?: keyof typeof SIGN_OUT_VARIANTS }) {
  const t = useTranslations("Bid")
  const { button, glyph } = SIGN_OUT_VARIANTS[variant]
  return (
    <button
      type="button"
      onClick={onSignOut}
      aria-label={t("signOutSonar")}
      title={t("signOutSonar")}
      className={button}
    >
      <PowerGlyph className={glyph} />
    </button>
  )
}
