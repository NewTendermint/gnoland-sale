/**
 * Live sale telemetry surface. Values are pulled from the Sonar
 * read-commitment-data endpoint at runtime; this layer renders the
 * placeholder grid so the layout locks in before wiring.
 */
export function SaleMetrics() {
  const metrics = [
    { label: "Total committed", value: "-" },
    { label: "Filled / Oversubscribed", value: "-" },
    { label: "Participants", value: "-" },
    { label: "Clearing price", value: "-" },
    { label: "My ranking", value: "-" },
    { label: "Unlock schedule", value: "TBD" },
  ]
  return (
    <section id="sale-metrics" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Live sale</p>
        <h2 className="mb-12 text-3xl font-bold">GNOT Token Sale: The native token for gno.land</h2>
        <dl className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-sm border border-border p-5">
              <dt className="mb-2 text-xs uppercase tracking-wide text-fg-muted">{m.label}</dt>
              <dd className="text-2xl font-bold tabular-nums">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
