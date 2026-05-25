/**
 * Investors placeholder. Minimal, no card.
 */
export function Investors() {
  return (
    <section id="investors" className="bg-bg-base py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
            Investors
          </p>
          <h2 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-6xl">
            Backed by
          </h2>
        </div>
        <div className="border-t border-border-subtle py-12">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">TBD</p>
          <p className="mt-4 max-w-2xl text-lg text-fg-muted">
            Investor lineup pending. Logos and short descriptions will appear here if announced
            before the sale.
          </p>
        </div>
      </div>
    </section>
  )
}
