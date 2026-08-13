"use client"

import { usePathname } from "@/i18n/navigation"
import { LOCALE_SWITCH_ENABLED, routing } from "@/i18n/routing"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

// Short visible code + full accessible name per locale.
const LABELS: Record<string, { code: string; nameKey: "languageEnglish" | "languageKorean" }> = {
  en: { code: "EN", nameKey: "languageEnglish" },
  ko: { code: "KO", nameKey: "languageKorean" },
}

// A locale change does a full-page navigation (like a normal link): the whole page reloads and
// replays its normal intro, which keeps behavior predictable and avoids partial-render glitches.
// We set next-intl's NEXT_LOCALE cookie first so the middleware serves the target locale even for
// the unprefixed default locale (with localePrefix 'as-needed', visiting "/" while the cookie still
// says "ko" would otherwise redirect back to "/ko").
function navigateToLocale(next: string, pathname: string): void {
  const hash = typeof window !== "undefined" ? window.location.hash : ""
  try {
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;samesite=lax`
  } catch {}
  const clean = pathname === "/" ? "" : pathname
  const target = (next === routing.defaultLocale ? clean || "/" : `/${next}${clean}`) + hash
  window.location.assign(target)
}

/**
 * Language switch.
 * - "button" (default): a circular button showing the active locale; clicking opens a small menu
 *   of the other locales. Used by the sticky top-right pill.
 * - "inline": a compact segmented control. Used inside the mobile menu.
 *
 * Renders nothing while a single locale ships (see i18n/routing.ts): no button, no menu, no ARIA
 * group. Call sites drop their wrapper too, so there is no empty box or stray spacing left.
 */
export function LocaleSwitch({ variant = "button" }: { variant?: "button" | "inline" }) {
  const t = useTranslations("A11y")
  const active = useLocale()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  function switchTo(next: string) {
    setOpen(false)
    if (next === active) return
    navigateToLocale(next, pathname)
  }

  // Close the menu on outside click / Escape (button variant only; harmless otherwise).
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // After the hooks, never before: hook order must stay stable across renders.
  if (!LOCALE_SWITCH_ENABLED) return null

  if (variant === "inline") {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a labelled ARIA group is the correct pattern for locale toggles (no lighter native element; fieldset needs a form)
      <div
        role="group"
        aria-label={t("switchLanguage")}
        className="inline-flex items-center gap-1 text-sm"
      >
        {routing.locales.map((loc, i) => {
          const { code, nameKey } = LABELS[loc]
          const isActive = loc === active
          return (
            <span key={loc} className="inline-flex items-center">
              {i > 0 ? (
                <span aria-hidden="true" className="px-1 text-muted">
                  /
                </span>
              ) : null}
              <button
                type="button"
                lang={loc}
                onClick={() => switchTo(loc)}
                aria-current={isActive ? "true" : undefined}
                aria-label={t(nameKey)}
                className={`rounded-md px-1 transition-colors ${
                  isActive ? "font-semibold text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {code}
              </button>
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("switchLanguage")}
        className={`flex size-9 items-center justify-center rounded-full border font-mono text-xs font-semibold tracking-tight transition-colors ${
          open
            ? "border-foreground text-foreground"
            : "border-border text-muted hover:border-foreground hover:text-foreground"
        }`}
      >
        {LABELS[active].code}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 min-w-[9.5rem] overflow-hidden rounded-lg border border-border bg-background py-1 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]"
        >
          {routing.locales.map((loc) => {
            const { code, nameKey } = LABELS[loc]
            const isActive = loc === active
            return (
              <button
                key={loc}
                type="button"
                role="menuitem"
                lang={loc}
                disabled={isActive}
                aria-current={isActive ? "true" : undefined}
                onClick={() => switchTo(loc)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                }`}
              >
                <span className="w-5 font-mono text-xs text-muted">{code}</span>
                <span className="flex-1">{t(nameKey)}</span>
                {isActive ? (
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
