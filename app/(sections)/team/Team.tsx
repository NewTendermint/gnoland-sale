/**
 * Team and advisors grid. Roster is pending sign-off, so the section
 * reserves vertical space and signals the gap explicitly.
 */
export function Team() {
  return (
    <section id="team" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Team and advisors</p>
        <h2 className="mb-12 text-3xl font-bold">The people behind Gno.land</h2>
        <div className="rounded-sm border border-border p-10 text-center">
          <p className="text-fg-muted">
            Team and advisor roster is being finalized. Names, photos, bios, and socials will be
            published here before the sale opens.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wide text-fg-faint">TBD</p>
        </div>
      </div>
    </section>
  )
}
