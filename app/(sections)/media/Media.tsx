/**
 * Press and media mentions. Empty by design until launch coverage lands;
 * the placeholder block keeps the page rhythm stable.
 */
export function Media() {
  return (
    <section id="media" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Media</p>
        <h2 className="mb-12 text-3xl font-bold">In the press</h2>
        <div className="rounded-sm border border-border p-10 text-center">
          <p className="text-fg-muted">
            Press coverage, podcast appearances, and video features will populate this grid as
            launch campaign rolls out.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wide text-fg-faint">TBD</p>
        </div>
      </div>
    </section>
  )
}
