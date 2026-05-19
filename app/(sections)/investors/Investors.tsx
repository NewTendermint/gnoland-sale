/**
 * Investors logo grid. The section is provisional: if no backers are
 * announced before launch, this block is dropped at the page-composition
 * layer rather than removed from the component library.
 */
export function Investors() {
  return (
    <section id="investors" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Investors</p>
        <h2 className="mb-12 text-3xl font-bold">Backed by</h2>
        <div className="rounded-sm border border-border p-10 text-center">
          <p className="text-fg-muted">
            Investor lineup pending. Logos and short descriptions will appear here if announced
            before the sale.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wide text-fg-faint">TBD</p>
        </div>
      </div>
    </section>
  )
}
