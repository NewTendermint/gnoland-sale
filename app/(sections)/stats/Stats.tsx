/**
 * Ecosystem-in-numbers. Asymmetric layout: title left, stats right. Stats
 * render as plain figures + labels (no card wrappers), separated by
 * hairline dividers.
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
    <section id="stats" className="bg-bg-base py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="mb-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
              By the numbers
            </p>
            <h2 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-6xl">
              The ecosystem in numbers
            </h2>
            <p className="mt-6 text-lg text-fg-muted md:text-xl">
              Five years of compounding open source. Built in public, by a growing developer
              community.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 lg:col-span-7">
            {stats.map((s) => (
              <div key={s.label} className="border-t border-border-subtle pt-6">
                <dd>
                  <p className="font-mono text-3xl font-bold tabular-nums text-fg-hi md:text-4xl lg:text-5xl">
                    {s.value}
                  </p>
                </dd>
                <dt className="mt-3 text-xs uppercase tracking-widest text-fg-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
