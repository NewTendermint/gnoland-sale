/**
 * Sticky BidPanel as a horizontal bar centered at the bottom of the
 * viewport. Live dot + clearing price + KPIs in a row with hairline
 * dividers + CTA mint on the right. Mint shadow ring + hairline accent
 * on top, same emphasis as before, just horizontal layout instead of
 * vertical tile.
 *
 * Placeholders: $0.12, 04d 12h, 1,247, $1.2M are hardcoded for the visual
 * pass. Layer 2 wires live data from Sonar.
 */
export function BidPanel() {
  return (
    <aside
      aria-label="Live bid panel"
      data-component="bid-panel"
      className="fixed bottom-6 left-1/2 z-50 w-[calc(100vw-3rem)] max-w-[1000px] -translate-x-1/2 overflow-hidden rounded-full bg-bg-elevated px-8 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(142,197,178,0.22)] backdrop-blur-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 0%, var(--mint) 50%, transparent 100%)",
        }}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-baseline gap-3">
          <span className="relative flex size-2 self-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-50" />
            <span className="relative inline-flex size-2 rounded-full bg-mint" />
          </span>
          <p className="font-mono text-2xl font-bold tabular-nums text-fg-hi md:text-3xl">$0.12</p>
          <p className="text-xs uppercase tracking-widest text-fg-muted">Clearing</p>
        </div>

        <div aria-hidden="true" className="hidden h-8 w-px bg-border-subtle md:block" />

        <div className="flex items-baseline gap-2">
          <p className="font-mono text-base tabular-nums text-fg-hi">04d 12h</p>
          <p className="text-xs uppercase tracking-widest text-fg-muted">Closes</p>
        </div>

        <div aria-hidden="true" className="hidden h-8 w-px bg-border-subtle md:block" />

        <div className="flex items-baseline gap-2">
          <p className="font-mono text-base tabular-nums text-fg-hi">1,247</p>
          <p className="text-xs uppercase tracking-widest text-fg-muted">Bidders</p>
        </div>

        <div aria-hidden="true" className="hidden h-8 w-px bg-border-subtle md:block" />

        <div className="flex items-baseline gap-2">
          <p className="font-mono text-base tabular-nums text-fg-hi">$1.2M</p>
          <p className="text-xs uppercase tracking-widest text-fg-muted">Committed</p>
        </div>

        <button
          type="button"
          className="ml-auto rounded-full bg-mint px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-bg-base transition-colors hover:bg-mint-soft"
        >
          Place bid
        </button>
      </div>
    </aside>
  )
}
