"use client"

/**
 * Live bid panel placeholder. Will be wired to wagmi + Sonar in Layer 2.
 * Layout and copy lock in here so design iterations do not block the integration work.
 */
export function BidPanel() {
  return (
    <aside data-component="bid-panel" className="rounded-sm border border-border bg-bg p-6">
      <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wide text-fg-muted">
        <span className="size-2 rounded-full bg-fg" />
        Live, English Auction
      </div>
      <div className="mb-6">
        <p className="mb-1 text-xs text-fg-muted">Clearing price</p>
        <p className="text-3xl font-bold tabular-nums">$0.00</p>
      </div>
      <dl className="space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-fg-muted">Committed</dt>
          <dd className="tabular-nums">-</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-fg-muted">Filled</dt>
          <dd className="tabular-nums">-</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-fg-muted">Bidders</dt>
          <dd className="tabular-nums">-</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-fg-muted">Closes in</dt>
          <dd className="tabular-nums">-</dd>
        </div>
      </dl>
      <button
        type="button"
        disabled
        className="mt-6 w-full rounded-sm bg-fg px-4 py-3 font-semibold text-bg"
      >
        Connect to bid
      </button>
    </aside>
  )
}
