/**
 * Three-card transparency surface: tokenomics breakdown, legal structure,
 * and smart contract audit. Each card is a stable target for the linked
 * PDFs once they are delivered.
 */
export function Transparency() {
  const cards = [
    {
      title: "Tokenomics",
      body: "Final allocation breakdown across sale, team, ecosystem, treasury, and advisors.",
      status: "TBD",
    },
    {
      title: "Legal structure",
      body: "Token disclosure document covering issuer, jurisdiction, and offering terms.",
      status: "TBD",
    },
    {
      title: "Audit",
      body: "Smart contract audit report for the Sonar SettlementSale contract used to process bids.",
      status: "TBD",
    },
  ]
  return (
    <section id="transparency" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Transparency report</p>
        <h2 className="mb-12 text-3xl font-bold">Verifiable, end-to-end</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <article key={c.title} className="rounded-sm border border-border p-6">
              <p className="mb-3 text-xs uppercase tracking-wide text-fg-faint">{c.status}</p>
              <h3 className="mb-2 font-semibold">{c.title}</h3>
              <p className="text-sm text-fg-muted">{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
