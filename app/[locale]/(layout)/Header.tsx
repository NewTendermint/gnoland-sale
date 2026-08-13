"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { LOCALE_SWITCH_ENABLED } from "@/i18n/routing"
import { track } from "@/lib/analytics/track"
import { LG_MEDIA_QUERY } from "@/lib/device/breakpoints"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { Logo } from "../(ui)/Logo"
import { Stagger } from "../(ui)/Stagger"
import { LocaleSwitch } from "./LocaleSwitch"
import { LEGAL_PATHS, navLinks } from "./nav.data"

export function Header() {
  const t = useTranslations("Nav")
  const tA11y = useTranslations("A11y")
  const pathname = usePathname()
  const [pastHero, setPastHero] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    const hero = document.getElementById("hero")
    if (!hero) return
    const root = document.querySelector(".screen")
    const io = new IntersectionObserver(([entry]) => setPastHero(!entry.isIntersecting), {
      root: root ?? null,
      threshold: 0,
    })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (menuOpen) {
      menuRef.current?.focus()
    } else if (wasOpen.current) {
      burgerRef.current?.focus()
    }
    wasOpen.current = menuOpen
    if (!menuOpen) return
    const screen = document.querySelector<HTMLElement>(".screen")
    if (screen) screen.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      if (screen) screen.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const mql = window.matchMedia(LG_MEDIA_QUERY)
    const onChange = () => {
      if (mql.matches) setMenuOpen(false)
    }
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [menuOpen])

  const mid = Math.ceil(navLinks.length / 2)
  const sides = [navLinks.slice(0, mid), navLinks.slice(mid)]
  const reveal = `transition-opacity duration-500 ${
    pastHero ? "opacity-100" : "pointer-events-none opacity-0"
  }`

  // On sub-pages, section anchors point nowhere; render logo + page title only.
  if (pathname !== "/") {
    const isLegal = LEGAL_PATHS.has(pathname)
    return (
      <header className="fixed left-[var(--reveal-padding)] right-[var(--reveal-padding)] top-[var(--reveal-padding)] z-[var(--z-header)] bg-transparent">
        <nav className="relative mx-auto grid max-w-[var(--max-width-container)] grid-cols-12 gap-6 px-6 py-4">
          <div className="col-span-12 flex items-center justify-between lg:col-span-10 lg:col-start-2">
            <Link href="/" aria-label={tA11y("brand")} className="shrink-0">
              <Logo className="h-6 w-auto" />
            </Link>
            {isLegal ? (
              <span className="text-sm font-medium tracking-tight text-muted">
                {t("pageTitleLegal")}
              </span>
            ) : null}
          </div>
        </nav>
      </header>
    )
  }

  return (
    <>
      <div
        id="mobile-menu"
        ref={menuRef}
        tabIndex={-1}
        inert={!menuOpen}
        className={`fixed inset-[var(--reveal-padding)] z-[var(--z-menu)] rounded-[var(--frame-radius)] bg-background transition-opacity duration-300 focus:outline-none lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav
          aria-label={tA11y("menu")}
          className="flex h-full flex-col items-center justify-center"
        >
          <Stagger
            as="ul"
            active={menuOpen}
            staggerMs={55}
            durationMs={500}
            yPx={12}
            className="flex flex-col items-center gap-5 text-center"
          >
            {navLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => {
                    setMenuOpen(false)
                    track("nav_clicked", { target: l.key })
                  }}
                  className="link-underline text-3xl font-semibold tracking-tight text-muted transition-colors hover:text-foreground"
                >
                  {t(l.key)}
                </a>
              </li>
            ))}
          </Stagger>
          {LOCALE_SWITCH_ENABLED ? (
            <div className="mt-10">
              <LocaleSwitch variant="inline" />
            </div>
          ) : null}
        </nav>
      </div>

      <header className="fixed left-[var(--reveal-padding)] right-[var(--reveal-padding)] top-[var(--reveal-padding)] z-[var(--z-header)] bg-transparent">
        <nav className="relative mx-auto grid max-w-[var(--max-width-container)] grid-cols-12 gap-6 px-6 py-4">
          <div className="col-span-12 flex items-center justify-between lg:col-span-10 lg:col-start-2 lg:justify-center">
            <ul
              className={`hidden flex-1 items-center justify-start gap-6 text-sm lg:flex ${reveal}`}
            >
              {sides[0].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => track("nav_clicked", { target: l.key })}
                    className="link-underline text-muted transition-colors hover:text-foreground"
                  >
                    {t(l.key)}
                  </a>
                </li>
              ))}
            </ul>

            <Link href="/" aria-label={tA11y("brand")} className="shrink-0 lg:px-8">
              <Logo className="h-6 w-auto" />
            </Link>

            <ul
              className={`hidden flex-1 items-center justify-end gap-6 text-sm lg:flex ${reveal}`}
            >
              {sides[1].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => track("nav_clicked", { target: l.key })}
                    className="link-underline text-muted transition-colors hover:text-foreground"
                  >
                    {t(l.key)}
                  </a>
                </li>
              ))}
            </ul>

            <button
              type="button"
              ref={burgerRef}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? tA11y("closeMenu") : tA11y("openMenu")}
              className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
            >
              <span aria-hidden="true" className="relative block h-4 w-5">
                <span
                  className={`absolute left-0 top-[5px] block h-px w-full bg-foreground transition-transform duration-300 ${
                    menuOpen ? "translate-y-[2.5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`absolute bottom-[5px] left-0 block h-px w-full bg-foreground transition-transform duration-300 ${
                    menuOpen ? "-translate-y-[2.5px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>
    </>
  )
}
