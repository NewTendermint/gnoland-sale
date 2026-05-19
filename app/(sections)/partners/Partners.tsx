/**
 * Strategic partners grid. Cards stay text-only at this layer; logo SVGs
 * land with the design-token pass.
 */
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
    <section id="partners" className="border-b border-border py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-2 text-xs uppercase tracking-wide text-fg-muted">Partners</p>
        <h2 className="mb-12 text-3xl font-bold">Working alongside</h2>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {partners.map((p) => (
            <li key={p.name} className="rounded-sm border border-border p-6">
              <h3 className="mb-2 font-semibold">{p.name}</h3>
              <p className="text-sm text-fg-muted">{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
