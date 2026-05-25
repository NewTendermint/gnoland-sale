/**
 * Transparency: 3 items as plain text with TBD badge inline. No cards.
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
    <section id="transparency" className="bg-bg-base py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-20 max-w-3xl">
          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-fg-muted">
            Transparency report
          </p>
          <h2 className="text-4xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-5xl lg:text-6xl">
            Verifiable, end-to-end
          </h2>
        </div>
        <ul className="grid grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-3">
          {cards.map((c, i) => (
            <li key={c.title}>
              <p className="font-mono text-xs uppercase tracking-widest text-fg-faint">
                {String(i + 1).padStart(2, "0")}
                <span className="ml-3 inline-block text-amber">{c.status}</span>
              </p>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-fg-hi md:text-2xl">
                {c.title}
              </h3>
              <p className="mt-4 text-base text-fg-body">{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
