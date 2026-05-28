/**
 * Site header with primary navigation and authentication entry points.
 * Sticky positioning ensures the bid CTA stays one click away during scroll.
 */
import { ThemeToggle } from "./ThemeToggle"

export function Header() {
  return (
    <header className="fixed left-[var(--reveal-padding)] right-[var(--reveal-padding)] top-[var(--reveal-padding)] z-[var(--z-header)] bg-transparent">
      <nav className="relative mx-auto flex max-w-[var(--max-width-container)] items-center justify-center px-6 py-4">
        <a href="/" className="text-lg font-bold text-foreground">
          gno.land
        </a>
        <div className="absolute right-6 top-1/2 -translate-y-1/2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
