"use client"

import { Cta } from "../../(ui)/Cta"

/** The active Sonar entity as a ghost CTA linking out to account management (add a business
 *  entity, switch, finish setup). Variant follows the surface: "ghost" on the light bar,
 *  "ghost-contrast" inside the dark capsule. Label = user's own PII, shown only to them. */
export function ManageEntityCta({
  href,
  label,
  variant = "ghost",
}: {
  href: string
  label?: string | null
  variant?: "ghost" | "ghost-contrast"
}) {
  return (
    <Cta variant={variant} href={href} external arrow ariaLabel="Manage your Sonar account">
      <span className="max-w-[20ch] truncate">{label ?? "Manage account"}</span>
    </Cta>
  )
}
