"use client"

/**
 * Site header. Desktop (>= lg): the gno.land wordmark stays centred with the nav
 * links on either side, both fading in once the visitor scrolls past the hero (an
 * IntersectionObserver on #hero, rooted to the .screen scroll container, flips the
 * reveal); links reserve their space while hidden so the wordmark never shifts.
 * Mobile (< lg): logo left + burger right, both always visible (the hero drops its
 * inline nav there, so the burger is the only nav above the fold). The burger opens
 * a frame-inset overlay (the page frame + radius stay visible around it) whose links
 * reveal line by line with a staggered transition - the same motion language as the
 * page's paragraph reveals, but driven by the open state so it plays on touch too
 * (the scroll-reveal system is disabled on coarse pointers). Disclosure pattern,
 * mirroring the bid panel: focus moves in on open, returns to the burger on close,
 * Escape closes, `inert` when closed, .screen scroll locked while open.
 */
import { useEffect, useRef, useState } from "react"
import { Stagger } from "../(ui)/Stagger"
import { LG_MEDIA_QUERY } from "../../lib/device/breakpoints"
import { navLinks } from "./nav.data"

export function Header() {
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

  // Disclosure plumbing, mirroring BidPanel's expanded sheet: focus moves into
  // the overlay on open and back to the burger on close, Escape closes, and the
  // .screen scroll is locked while open so the page never moves underneath.
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

  // The overlay is lg:hidden; if the window grows past lg while it is open,
  // close it so the scroll lock and inert state never outlive their UI.
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

  return (
    <>
      {/* Mobile nav overlay: inset by the page frame so the black chrome + radius
          stay visible around it (signature element). Below the header in the
          z-scale so the wordmark + burger row stays on top and usable. */}
      <div
        id="mobile-menu"
        ref={menuRef}
        tabIndex={-1}
        inert={!menuOpen}
        className={`fixed inset-[var(--reveal-padding)] z-[var(--z-menu)] rounded-[var(--frame-radius)] bg-background transition-opacity duration-300 focus:outline-none lg:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <nav aria-label="Menu" className="flex h-full flex-col items-center justify-center">
          {/* Links reveal line by line on open: the shared Stagger in controlled
              mode (active=menuOpen). It cascades by index, so it scales to any number
              of links and plays on touch (the scroll-reveal path is off on coarse
              pointers). The overlay's opacity fades them out on close. */}
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
                  onClick={() => setMenuOpen(false)}
                  className="link-underline text-3xl font-semibold tracking-tight text-muted transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </Stagger>
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
                    className="link-underline text-muted transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <a href="/" className="shrink-0 text-lg font-bold text-foreground lg:px-8">
              Gno.land
            </a>

            <ul
              className={`hidden flex-1 items-center justify-end gap-6 text-sm lg:flex ${reveal}`}
            >
              {sides[1].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="link-underline text-muted transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Burger (below lg, right side): two hairlines folding into a cross.
                44px hit area. Always visible on mobile - it is the only nav above
                the fold once the hero drops its inline links. */}
            <button
              type="button"
              ref={burgerRef}
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
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
