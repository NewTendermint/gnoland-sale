/**
 * Sale section. Merged "Sale Metrics" (xls #2, live data) and "Token Sale
 * Details" (xls #3, static term sheet) into a single section with TWO
 * visually distinct blocks:
 *   - LIVE block at the top: monumental tabular figures with a live dot
 *     eyebrow. Values pulled from Sonar at runtime (placeholders here).
 *   - TERMS block below, separated by a strong hairline: 4 thematic groups
 *     (Token / Numbers / Bid range / Schedule) in a quieter key/value grid.
 *
 * The merge eliminates the duplicated "Unlock schedule" that lived in both
 * sections in the xls source, and stacks live signal above static reference.
 */
export function TokenDetails() {
  const liveMetrics: Array<{ value: string; label: string }> = [
    { value: "-", label: "Clearing price" },
    { value: "-", label: "Total committed" },
    { value: "-", label: "Filled / Oversubscribed" },
    { value: "-", label: "Participants" },
    { value: "-", label: "My auction ranking" },
  ]

  const termGroups: Array<{
    eyebrow: string
    rows: Array<{ label: string; value: string; tbd?: boolean }>
  }> = [
    {
      eyebrow: "Token",
      rows: [
        { label: "Token", value: "GNOT" },
        { label: "Format", value: "Uniform Price Auction (English Auction)" },
        { label: "Currencies", value: "USDC, USDT (on Base)" },
      ],
    },
    {
      eyebrow: "Numbers",
      rows: [
        { label: "Total raise", value: "TBD", tbd: true },
        { label: "FDV (when met)", value: "TBD", tbd: true },
        { label: "Allocation", value: "TBD", tbd: true },
      ],
    },
    {
      eyebrow: "Bid range",
      rows: [
        { label: "Minimum price", value: "TBD", tbd: true },
        { label: "Min commitment", value: "TBD", tbd: true },
        { label: "Max commitment", value: "TBD", tbd: true },
      ],
    },
    {
      eyebrow: "Schedule",
      rows: [
        { label: "Contribution window", value: "TBD", tbd: true },
        { label: "Mainnet launch", value: "Q1 2026 Beta · Q3 2026 Mainnet" },
        { label: "Unlock schedule", value: "TBD", tbd: true },
      ],
    },
  ]

  return (
    <section id="token-details" className="bg-bg-base py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-mint" />
            </span>
            <p className="font-mono text-xs uppercase tracking-widest text-mint">Live</p>
          </div>
          <h2 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-6xl">
            GNOT Token Sale
          </h2>
          <p className="mt-4 max-w-2xl text-base text-fg-muted md:text-lg">
            The native token for gno.land. Live snapshot and full terms below.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border-subtle pt-8 md:grid-cols-3 lg:grid-cols-5">
          {liveMetrics.map((m) => (
            <div key={m.label}>
              <dd>
                <p className="font-mono text-2xl font-bold tabular-nums text-fg-hi md:text-3xl lg:text-4xl">
                  {m.value}
                </p>
              </dd>
              <dt className="mt-2 text-xs uppercase tracking-widest text-fg-muted">{m.label}</dt>
            </div>
          ))}
        </dl>

        <hr className="my-12 border-0 border-t border-border-default" />

        <div className="mb-4">
          <p className="font-mono text-xs uppercase tracking-widest text-fg-muted">Terms</p>
        </div>
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
          {termGroups.map((g) => (
            <div key={g.eyebrow}>
              <p className="mb-4 font-mono text-xs uppercase tracking-widest text-mint">
                {g.eyebrow}
              </p>
              <dl className="border-t border-border-subtle">
                {g.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col gap-1 border-b border-border-subtle py-3"
                  >
                    <dt className="text-xs uppercase tracking-widest text-fg-muted">{row.label}</dt>
                    <dd
                      className={`text-sm font-medium ${
                        row.tbd ? "font-mono uppercase tracking-widest text-amber" : "text-fg-hi"
                      }`}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border-subtle pt-6">
          <a
            href="#token-disclosure"
            className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-mint underline-offset-4 hover:underline"
          >
            Token Disclosure Document
            <span aria-hidden="true">↗</span>
          </a>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">
            Full tokenomics, legal structure, and smart contract audit in one PDF.
          </p>
        </div>
      </div>
    </section>
  )
}
