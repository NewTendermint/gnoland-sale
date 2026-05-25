/**
 * Live sale metrics (per xls section #2). KPIs are pulled live from the
 * Sonar `read-commitment-data` endpoint at runtime. Layer 1 renders the
 * placeholder grid with "-" so the layout locks in before wiring.
 *
 * Note: these KPIs ALSO appear in the persistent sticky BidPanel tile in
 * the corner. Duplication is intentional: the section gives the live
 * snapshot at-a-glance with monumental numbers, the sticky keeps them
 * always accessible during scroll.
 */
export function SaleMetrics() {
  const metrics: Array<{ value: string; label: string; tbd?: boolean }> = [
    { value: "-", label: "Clearing price" },
    { value: "-", label: "Total committed" },
    { value: "-", label: "Filled / Oversubscribed" },
    { value: "-", label: "Participants" },
    { value: "-", label: "My auction ranking" },
    { value: "TBD", label: "Unlock schedule", tbd: true },
  ]
  return (
    <section id="sale-metrics" className="bg-bg-base py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-20 flex max-w-3xl gap-6">
          <div aria-hidden="true" className="w-0.5 shrink-0 bg-fg-hi/40" />
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
              Live sale
            </p>
            <h2 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-6xl">
              GNOT Token Sale
            </h2>
            <p className="mt-6 text-lg text-fg-muted md:text-xl">The native token for gno.land.</p>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-x-12 gap-y-12 border-t border-border-subtle pt-10 md:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label}>
              <dd>
                <p
                  className={`font-mono font-bold tabular-nums ${
                    m.tbd
                      ? "text-3xl uppercase tracking-widest text-amber md:text-4xl"
                      : "text-4xl text-fg-hi md:text-5xl lg:text-6xl"
                  }`}
                >
                  {m.value}
                </p>
              </dd>
              <dt className="mt-4 text-xs uppercase tracking-widest text-fg-muted">{m.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
