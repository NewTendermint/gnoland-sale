/**
 * Partners. Same compact grid pattern as Ecosystem.
 */

const ACCENT_BLOCKS = ["var(--mint)", "var(--info)", "var(--amber)", "var(--mint-soft)"]

export function Partners() {
  const partners = [
    {
      name: "Samourai Coop",
      body: "A development team focused on DAOs and sustainable, community-powered applications, building the governance and coordination tools that decentralized communities need to thrive.",
    },
    {
      name: "Berty",
      body: "A non-profit NGO specializing in secure, peer-to-peer mobile communication. Berty's work on privacy-first infrastructure aligns closely with Gno.land's mission to build a censorship-resistant internet.",
    },
    {
      name: "Onbloc",
      body: "An engineering team building consumer-facing applications on Gno.land, including Adena Wallet, Gnoswap, and Gnoscan, some of the ecosystem's most used tools today.",
    },
    {
      name: "AtomOne",
      body: "A community-driven, constitutionally governed blockchain designed to prioritize security, decentralization, and innovation within the Cosmos ecosystem. Gno.land plans to integrate with AtomOne for consensus.",
    },
  ]
  return (
    <section id="partners" className="bg-bg-base py-20 lg:py-24">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="mb-12 flex max-w-3xl gap-6">
          <div aria-hidden="true" className="w-0.5 shrink-0 bg-fg-hi/40" />
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-fg-muted">
              Partners
            </p>
            <h2 className="text-3xl font-bold uppercase leading-[1.05] tracking-tight text-fg-hi md:text-4xl lg:text-5xl">
              Working alongside
            </h2>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
          {partners.map((p, i) => (
            <li key={p.name}>
              <div
                aria-hidden="true"
                className="mb-4 size-10 rounded-md"
                style={{ backgroundColor: ACCENT_BLOCKS[i % ACCENT_BLOCKS.length] }}
              />
              <h3 className="mb-1 text-base font-semibold tracking-tight text-fg-hi">{p.name}</h3>
              <p className="line-clamp-3 text-sm text-fg-body">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
