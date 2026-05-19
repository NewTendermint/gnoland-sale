/**
 * Ecosystem-in-numbers grid. Big tabular figures lead, label sits below.
 * Counter-up animation is intentionally deferred to a later layer.
 */
export function Stats() {
  const stats = [
    { value: "5+", label: "Years building" },
    { value: "150+", label: "Contributors" },
    { value: "100+", label: "On-chain packages" },
    { value: "2400+", label: "PRs merged" },
    { value: "100+", label: "Open source repos" },
    { value: "2900+", label: "Commits" },
    { value: "1100+", label: "Issues closed" },
  ]
  return (
    <section id="stats" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">By the numbers</p>
        <h2 className="mb-12 text-3xl font-bold">The ecosystem in numbers</h2>
        <dl className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-7">
          {stats.map((s) => (
            <div key={s.label} className="rounded-sm border border-border p-5">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <p className="mb-2 text-3xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs uppercase tracking-wide text-fg-muted">{s.label}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
