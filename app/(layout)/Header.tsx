"use client"

/**
 * Site header. The gno.land wordmark stays centred; the nav links sit on either side
 * and stay hidden until the visitor scrolls past the hero, then fade in (an
 * IntersectionObserver on #hero, rooted to the .screen scroll container, flips the
 * reveal). Links reserve their space while hidden so the wordmark never shifts; only
 * opacity animates. Desktop-only; mobile keeps just the wordmark (theme toggle lives
 * in the footer).
 */
import { useEffect, useState } from "react"
import { navLinks } from "./nav.data"

export function Header() {
  const [pastHero, setPastHero] = useState(false)

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

  const mid = Math.ceil(navLinks.length / 2)
  const sides = [navLinks.slice(0, mid), navLinks.slice(mid)]
  const reveal = `transition-opacity duration-500 ${
    pastHero ? "opacity-100" : "pointer-events-none opacity-0"
  }`

  return (
    <header className="fixed left-[var(--reveal-padding)] right-[var(--reveal-padding)] top-[var(--reveal-padding)] z-[var(--z-header)] bg-transparent">
      <nav className="relative mx-auto grid max-w-[var(--max-width-container)] grid-cols-12 gap-6 px-6 py-4">
        <div className="col-span-12 flex items-center justify-center lg:col-span-10 lg:col-start-2">
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

          <a href="/" className="shrink-0 px-8 text-lg font-bold text-foreground">
            gno.land
          </a>

          <ul className={`hidden flex-1 items-center justify-end gap-6 text-sm lg:flex ${reveal}`}>
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
        </div>
      </nav>
    </header>
  )
}
