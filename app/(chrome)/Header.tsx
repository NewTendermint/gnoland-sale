/**
 * Site header with primary navigation and authentication entry points.
 * Sticky positioning ensures the bid CTA stays one click away during scroll.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
        <a href="/" className="font-bold text-lg">
          gno.land
        </a>
        <ul className="hidden gap-6 text-sm text-fg-muted md:flex">
          <li>
            <a href="#sale-metrics">Sale</a>
          </li>
          <li>
            <a href="#how-it-works">How it works</a>
          </li>
          <li>
            <a href="#token-details">Token</a>
          </li>
          <li>
            <a href="#roadmap">Roadmap</a>
          </li>
        </ul>
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-sm border border-border px-4 py-2 text-sm">
            Register
          </button>
          <button type="button" className="rounded-sm bg-fg px-4 py-2 text-sm text-bg">
            Connect Wallet
          </button>
        </div>
      </nav>
    </header>
  )
}
